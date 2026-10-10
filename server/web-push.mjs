// Web Push payload encryption (RFC 8291) and VAPID (RFC 8292), using Web Crypto.
const bytes=value=>new TextEncoder().encode(value);
const concat=(...arrays)=>{const out=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){out.set(a,offset);offset+=a.length;}return out;};
export function decode64(value){if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid key');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export function encode64(value){return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function hkdf(input,salt,info,length){const key=await crypto.subtle.importKey('raw',input,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},key,length*8));}
export function validateSubscription(value){
  if(!value||typeof value!=='object'||typeof value.endpoint!=='string'||value.endpoint.length>2000)throw new Error('Invalid subscription');
  const endpoint=new URL(value.endpoint);
  // Only recognised browser push services; user input cannot target arbitrary servers.
  const allowed=endpoint.hostname==='fcm.googleapis.com'||endpoint.hostname==='updates.push.services.mozilla.com'||endpoint.hostname==='push.services.mozilla.com'||endpoint.hostname==='web.push.apple.com'||endpoint.hostname.endsWith('.push.apple.com')||endpoint.hostname==='notify.windows.com'||endpoint.hostname.endsWith('.notify.windows.com');
  if(endpoint.protocol!=='https:'||endpoint.port||endpoint.username||endpoint.password||!allowed)throw new Error('Unsupported push service');
  const publicKey=decode64(value.keys?.p256dh),auth=decode64(value.keys?.auth);
  if(publicKey.length!==65||publicKey[0]!==4||auth.length!==16)throw new Error('Invalid subscription keys');
  return {endpoint:endpoint.href,keys:{p256dh:value.keys.p256dh,auth:value.keys.auth}};
}
export async function encryptPayload(subscription,payload,options={}){
  const clientPublic=decode64(subscription.keys.p256dh),auth=decode64(subscription.keys.auth);
  const clientKey=await crypto.subtle.importKey('raw',clientPublic,{name:'ECDH',namedCurve:'P-256'},false,[]);
  const pair=options.pair||await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
  const serverPublic=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey));
  const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:clientKey},pair.privateKey,256));
  const input=await hkdf(shared,auth,concat(bytes('WebPush: info\0'),clientPublic,serverPublic),32);
  const salt=options.salt||crypto.getRandomValues(new Uint8Array(16));
  const cek=await hkdf(input,salt,bytes('Content-Encoding: aes128gcm\0'),16);
  const nonce=await hkdf(input,salt,bytes('Content-Encoding: nonce\0'),12);
  const plaintext=concat(options.plaintext||bytes(JSON.stringify(payload)),new Uint8Array([2]));
  if(plaintext.length+102>4096)throw new Error('Notification payload too large');
  const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,plaintext));
  const header=new Uint8Array(5);new DataView(header.buffer).setUint32(0,4096);header[4]=serverPublic.length;
  return concat(salt,header,serverPublic,encrypted);
}
export async function vapidHeader(endpoint,env,now=new Date()){
  const publicKey=decode64(env.VAPID_PUBLIC_KEY);if(publicKey.length!==65)throw new Error('Invalid push configuration');
  const privateJwk=JSON.parse(env.VAPID_PRIVATE_KEY);
  if(encode64(concat(new Uint8Array([4]),decode64(privateJwk.x),decode64(privateJwk.y)))!==env.VAPID_PUBLIC_KEY)throw new Error('Push keys do not match');
  const key=await crypto.subtle.importKey('jwk',privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const header=encode64(bytes(JSON.stringify({typ:'JWT',alg:'ES256'})));
  const claims=encode64(bytes(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(now.getTime()/1000)+43200,sub:'mailto:contact@willfitgym.com'})));
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,bytes(header+'.'+claims));
  return `vapid t=${header}.${claims}.${encode64(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}
export async function sendPush(subscription,payload,env,now=new Date(),fetcher=fetch){
  const body=await encryptPayload(subscription,payload);
  const authorization=await vapidHeader(subscription.endpoint,env,now);
  return fetcher(subscription.endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:authorization,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'600',Urgency:'high'},body});
}
