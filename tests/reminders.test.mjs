import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {dueItems,notificationFor} from '../public/reminder-model.mjs';
import {encryptPayload,encode64,decode64,vapidHeader,validateSubscription} from '../server/web-push.mjs';
import {saveSubscription,dispatchReminders} from '../server/reminders.mjs';
import worker,{ensureWeek} from '../server/worker.mjs';
function db(){
  const database=new DatabaseSync(':memory:');
  for(const name of ['0001.sql','0002_reminders.sql'])database.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
  database.exec('PRAGMA foreign_keys=ON');
  const prepare=(sql,args=[])=>({bind(...values){return prepare(sql,values)},async first(){return database.prepare(sql).get(...args)||null},async all(){return {results:database.prepare(sql).all(...args)}},async run(){return {meta:{changes:Number(database.prepare(sql).run(...args).changes)}}}});
  return {prepare,async batch(statements){database.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());database.exec('COMMIT');return out;}catch(error){database.exec('ROLLBACK');throw error;}}};
}
const item={id:'2026-10-05-story-0',week:'2026-10-05',date:'2026-10-08',time:'18:00',type:'story',title:{en:'Iron carries oxygen',fr:'Le fer transporte l’oxygène'}};
async function subscription(){const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);return {pair,value:{endpoint:'https://fcm.googleapis.com/fcm/send/test-device',keys:{p256dh:encode64(await crypto.subtle.exportKey('raw',pair.publicKey)),auth:encode64(crypto.getRandomValues(new Uint8Array(16)))}}};}
test('reminder due times follow Kinshasa and skip stale or future posts',()=>{
  assert.equal(dueItems([item],new Date('2026-10-08T16:59:59Z')).length,0);
  assert.equal(dueItems([item],new Date('2026-10-08T17:00:00Z')).length,1);
  assert.equal(dueItems([item],new Date('2026-10-08T17:09:59Z')).length,1);
  assert.equal(dueItems([item],new Date('2026-10-08T17:10:00Z')).length,0);
  const payload=notificationFor(item,'fr');assert.match(payload.body,/18:00 Kinshasa · 00:00 WIB \(lendemain\)/);assert.match(payload.url,/content=2026-10-05-story-0/);
});
test('encrypted payload decrypts on the subscribed device, with the required final-record delimiter',async()=>{
  const {pair,value}=await subscription(),payload=notificationFor(item,'en');
  const body=await encryptPayload(value,payload);
  assert.equal(new DataView(body.buffer).getUint32(16),4096);assert.equal(body[20],65);
  const server=await crypto.subtle.importKey('raw',body.slice(21,86),{name:'ECDH',namedCurve:'P-256'},false,[]);
  const shared=await crypto.subtle.deriveBits({name:'ECDH',public:server},pair.privateKey,256);
  const publicKey=decode64(value.keys.p256dh),serverKey=body.slice(21,86),info=new Uint8Array(14+65+65);info.set(new TextEncoder().encode('WebPush: info\0'));info.set(publicKey,14);info.set(serverKey,79);
  async function derive(input,salt,info,length){const key=await crypto.subtle.importKey('raw',input,'HKDF',false,['deriveBits']);return crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8);}
  const intermediate=await derive(shared,decode64(value.keys.auth),info,32);
  const cek=await derive(intermediate,body.slice(0,16),new TextEncoder().encode('Content-Encoding: aes128gcm\0'),16);
  const nonce=await derive(intermediate,body.slice(0,16),new TextEncoder().encode('Content-Encoding: nonce\0'),12);
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['decrypt']);
  const plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:nonce},key,body.slice(86)));
  assert.equal(plain.at(-1),2);assert.deepEqual(JSON.parse(new TextDecoder().decode(plain.slice(0,-1))),payload);
});
test('VAPID JWT is signed by the configured key and bound to the push-service origin',async()=>{
  const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
  const env={VAPID_PUBLIC_KEY:encode64(await crypto.subtle.exportKey('raw',pair.publicKey)),VAPID_PRIVATE_KEY:JSON.stringify(await crypto.subtle.exportKey('jwk',pair.privateKey))};
  const header=await vapidHeader('https://fcm.googleapis.com/fcm/send/device',env,new Date('2026-10-08T17:00:00Z'));
  const token=header.match(/^vapid t=([^,]+)/)[1];const [head,claims,signature]=token.split('.');
  assert.ok(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},pair.publicKey,decode64(signature),new TextEncoder().encode(head+'.'+claims)));
  const data=JSON.parse(new TextDecoder().decode(decode64(claims)));assert.equal(data.aud,'https://fcm.googleapis.com');assert.equal(data.exp,Math.floor(Date.parse('2026-10-08T17:00:00Z')/1000)+43200);
});
test('subscriptions reject arbitrary network targets and invalid key lengths',async()=>{
  const {value}=await subscription();assert.deepEqual(validateSubscription(value),value);
  for(const endpoint of ['http://fcm.googleapis.com/x','https://localhost/x','https://fcm.googleapis.com.evil.test/x','https://user@fcm.googleapis.com/x','https://fcm.googleapis.com:8443/x'])assert.throws(()=>validateSubscription({...value,endpoint}));
  assert.throws(()=>validateSubscription({...value,keys:{...value.keys,auth:'abcd'}}));
});
test('background delivery uses saved edits and language, suppresses duplicates, and removes expired devices',async()=>{
  const database=db(),{value}=await subscription();await saveSubscription(database,{subscription:value,language:'fr'},'https://studio.test');
  const plan=await ensureWeek(database,'2026-10-05'),first=plan.items.find(i=>i.type==='story');
  await database.prepare('UPDATE items SET data = ?, version = version+1 WHERE id = ?').bind(JSON.stringify({...first,date:'2026-10-08',time:'18:00',title:{...first.title,fr:'Titre validé par l’équipe'}}),first.id).run();
  const env={DB:database,TEAM_KEY:'team',VAPID_PUBLIC_KEY:'configured',VAPID_PRIVATE_KEY:'configured'};const sent=[];
  const send=async(sub,payload)=>{sent.push(payload);return new Response(null,{status:201});};
  await dispatchReminders(env,new Date('2026-10-08T17:00:00Z'),ensureWeek,send);
  assert.ok(sent.some(p=>p.body.includes('Titre validé par l’équipe')));const count=sent.length;
  await dispatchReminders(env,new Date('2026-10-08T17:01:00Z'),ensureWeek,send);assert.equal(sent.length,count);
  await database.prepare('DELETE FROM push_deliveries').run();
  await dispatchReminders(env,new Date('2026-10-08T17:02:00Z'),ensureWeek,async()=>new Response(null,{status:410}));
  assert.equal((await database.prepare('SELECT * FROM push_subscriptions').all()).results.length,0);
});
test('failed deliveries retry with a delay and stop after a successful send',async()=>{
  const database=db(),{value}=await subscription();await saveSubscription(database,{subscription:value,language:'en'},'https://studio.test');
  const env={DB:database,TEAM_KEY:'team',VAPID_PUBLIC_KEY:'yes',VAPID_PRIVATE_KEY:'yes'};let calls=0;
  const ensure=async()=>({items:[item]}),send=async()=>{calls++;return new Response(null,{status:calls===1?503:201});};
  await dispatchReminders(env,new Date('2026-10-08T17:00:00Z'),ensure,send);
  await dispatchReminders(env,new Date('2026-10-08T17:01:00Z'),ensure,send);assert.equal(calls,1);
  await dispatchReminders(env,new Date('2026-10-08T17:02:00Z'),ensure,send);assert.equal(calls,2);
  await dispatchReminders(env,new Date('2026-10-08T17:03:00Z'),ensure,send);assert.equal(calls,2);
});
test('preview exposes setup status without claiming active notifications; writes require same-origin access',async()=>{
  const env={DB:db(),LOCAL_PREVIEW:'true'};
  const config=await worker.fetch(new Request('https://studio.test/api/reminders/config'),env);assert.deepEqual(await config.json(),{ready:false,publicKey:null});
  const response=await worker.fetch(new Request('https://studio.test/api/reminders/subscribe',{method:'POST',headers:{Origin:'https://evil.test'},body:'{}'}),env);assert.equal(response.status,403);
});
test('payload encryption matches the published RFC 8291 test vector exactly',async()=>{
  const pub='BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',raw=decode64(pub);
  const jwk={kty:'EC',crv:'P-256',x:encode64(raw.slice(1,33)),y:encode64(raw.slice(33)),d:'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',ext:true};
  const privateKey=await crypto.subtle.importKey('jwk',jwk,{name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
  const publicKey=await crypto.subtle.importKey('raw',raw,{name:'ECDH',namedCurve:'P-256'},true,[]);
  const value={keys:{p256dh:'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',auth:'BTBZMqHH6r4Tts7J_aSIgg'}};
  const body=await encryptPayload(value,{}, {pair:{privateKey,publicKey},salt:decode64('DGv6ra1nlYgDCS1FRnbzlw'),plaintext:new TextEncoder().encode('When I grow up, I want to be a watermelon')});
  assert.equal(encode64(body),'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
});
test('devices can subscribe, change their notification language and unsubscribe without duplicates',async()=>{
  const database=db(),{value}=await subscription();const env={DB:database,TEAM_KEY:'team',VAPID_PUBLIC_KEY:'public',VAPID_PRIVATE_KEY:'private'};
  const login=await worker.fetch(new Request('https://studio.test/api/access',{method:'POST',headers:{Origin:'https://studio.test'},body:JSON.stringify({code:'team'})}),env);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const post=(path,body)=>worker.fetch(new Request('https://studio.test/api/reminders/'+path,{method:'POST',headers:{Origin:'https://studio.test',Cookie:cookie},body:JSON.stringify(body)}),env);
  assert.equal((await post('subscribe',{subscription:value,language:'fr'})).status,200);
  assert.equal((await post('subscribe',{subscription:value,language:'en'})).status,200);
  const devices=(await database.prepare('SELECT * FROM push_subscriptions').all()).results;assert.equal(devices.length,1);assert.equal(devices[0].language,'en');
  assert.equal((await post('subscribe',{subscription:{...value,endpoint:'https://private-server.test/x'},language:'fr'})).status,400);
  assert.equal((await post('unsubscribe',{endpoint:value.endpoint})).status,200);
  assert.equal((await database.prepare('SELECT * FROM push_subscriptions').all()).results.length,0);
});
