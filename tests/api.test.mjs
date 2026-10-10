import {generatePlan as generateLegacyPlan} from '../server/legacy-planner-v2.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{ensureWeek} from '../server/worker.mjs';
import {normalizeCaption,CONTACT} from '../public/planner.mjs';
function db(){const database=new DatabaseSync(':memory:');database.exec(readFileSync(new URL('../migrations/0001.sql',import.meta.url),'utf8'));database.exec(readFileSync(new URL('../migrations/0002_reminders.sql',import.meta.url),'utf8'));const prepare=(sql,args=[])=>({bind(...values){return prepare(sql,values)},async first(){return database.prepare(sql).get(...args)||null},async all(){return {results:database.prepare(sql).all(...args)}},async run(){return {meta:{changes:Number(database.prepare(sql).run(...args).changes)}}}});return {prepare,async batch(statements){database.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());database.exec('COMMIT');return out}catch(e){database.exec('ROLLBACK');throw e}}};}
const request=(path,method='GET',body,cookie,origin='https://studio.test')=>new Request('https://studio.test'+path,{method,headers:{...(method!=='GET'?{origin,'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('production fails closed until shared access is configured',async()=>{
  const response=await worker.fetch(request('/api/plan'),{DB:db()});
  assert.equal(response.status,503);
  const locked=await worker.fetch(request('/api/plan'),{DB:db(),TEAM_KEY:'a-private-team-code'});
  assert.equal(locked.status,401);
});
test('team code authenticates and cross-origin writes are denied',async()=>{
  const env={DB:db(),TEAM_KEY:'a-private-team-code'};
  assert.equal((await worker.fetch(request('/api/access','POST',{code:'wrong'}),env)).status,401);
  const login=await worker.fetch(request('/api/access','POST',{code:env.TEAM_KEY}),env);
  assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const plan=await worker.fetch(request('/api/plan?week=2026-10-05','GET',null,cookie),env);
  assert.equal(plan.status,200);
  assert.equal((await worker.fetch(request('/api/access','POST',{code:env.TEAM_KEY},null,'https://evil.test'),env)).status,403);
});
test('status and caption persist between team requests, with conflicting edits rejected',async()=>{
  const env={DB:db(),LOCAL_PREVIEW:'true'};
  const original=await (await worker.fetch(request('/api/plan?week=2026-10-05'),env)).json();
  const item=original.items[0];
  const updated=await worker.fetch(request('/api/items/'+item.id,'PATCH',{posted:true,caption:{en:'New caption'},version:0}),env);
  assert.equal(updated.status,200);
  const saved=await updated.json();assert.equal(saved.version,1);assert.equal(saved.posted,true);
  const conflict=await worker.fetch(request('/api/items/'+item.id,'PATCH',{posted:false,version:0}),env);
  assert.equal(conflict.status,409);
  const reload=await ensureWeek(env.DB,'2026-10-05');
  const persisted=reload.items.find(i=>i.id===item.id);assert.equal(persisted.posted,true);assert.equal(persisted.caption.en,normalizeCaption('New caption'));assert.equal(persisted.caption.fr,item.caption.fr);
  assert.equal(reload.items.length,12);
});
test('upgrading an existing week preserves edited captions, notes and posted status',async()=>{
  const database=db();const before=await ensureWeek(database,'2026-10-05');const item=before.items[0];
  const edited={...item,posted:true,note:'Keep the team note',caption:{en:'Team-written caption',fr:'Légende écrite par l’équipe'}};
  await database.prepare('UPDATE items SET data = ?, version = ? WHERE id = ?').bind(JSON.stringify(edited),4,item.id).run();
  await database.prepare('UPDATE weeks SET engine = ? WHERE week = ?').bind('editorial-library-v1',before.week).run();
  const after=await ensureWeek(database,before.week);
  const kept=after.items.find(i=>i.id===item.id);
  assert.equal(kept.posted,true);assert.equal(kept.note,'Keep the team note');assert.equal(kept.caption.en,normalizeCaption('Team-written caption'));
  assert.equal(after.items.length,12);assert.ok(after.items.every(i=>Object.values(i.caption).every(c=>c.endsWith(CONTACT))));
  const repeat=await ensureWeek(database,before.week);assert.equal(repeat.items.find(i=>i.id===item.id).version,kept.version);
});
test('updates reject invalid dates, unknown fields and unsafe media links',async()=>{
  const env={DB:db(),LOCAL_PREVIEW:'true'};
  const plan=await ensureWeek(env.DB,'2026-02-23');const id=plan.items[0].id;
  for(const patch of [{date:'2026-02-30'},{date:'2026-03-02'},{mediaUrl:'javascript:alert(1)'},{caption:{en:'x'.repeat(2201)}},{posted:'yes'},{type:'reel'}])assert.equal((await worker.fetch(request('/api/items/'+id,'PATCH',{...patch,version:0}),env)).status,400);
});
test('Sunday scheduler creates next week once without overwriting later edits',async()=>{
  const env={DB:db()};let work;const ctx={waitUntil(p){work=p}};
  await worker.scheduled({scheduledTime:Date.parse('2026-10-11T05:00:00Z')},env,ctx);await work;
  const plan=await ensureWeek(env.DB,'2026-10-12');assert.equal(plan.items.length,12);
  assert.equal(plan.generatedAt,'2026-10-11T05:00:00.000Z');
  await worker.scheduled({scheduledTime:Date.parse('2026-10-11T05:01:00Z')},env,ctx);await work;
  const again=await ensureWeek(env.DB,'2026-10-12');assert.equal(again.generatedAt,plan.generatedAt);
});

test('v2 generated copy refreshes after normalization, preserving schedule and team notes',async()=>{
  const database=db();const legacy=generateLegacyPlan('2026-10-05');
  await database.prepare('INSERT INTO weeks (week,generated_at,engine) VALUES (?,?,?)').bind(legacy.week,legacy.generatedAt,legacy.engine).run();
  for(const item of legacy.items){
    const original={...item,caption:{fr:normalizeCaption(item.caption.fr),en:normalizeCaption(item.caption.en)},time:'10:15',note:'Keep production note',mediaUrl:'https://drive.google.com/file/d/approved',posted:true};
    await database.prepare('INSERT INTO items (id,week,data,version) VALUES (?,?,?,?)').bind(item.id,item.week,JSON.stringify(original),1).run();
  }
  const plan=await ensureWeek(database,legacy.week);
  assert.equal(plan.engine,'daily-stories-v4');
  for(const item of plan.items.filter(i=>legacy.items.some(old=>old.id===i.id))){
    assert.equal(item.time,'10:15');assert.equal(item.note,'Keep production note');assert.equal(item.posted,true);
    assert.match(item.caption.en,/💬|📊/);
    if(item.type==='story'){assert.equal(item.sourceKind,'science');assert.ok(item.storyText.en);}
  }
  const again=await ensureWeek(database,legacy.week);assert.deepEqual(again.items,plan.items);
});
test('story text edits persist independently in English and French',async()=>{
  const env={DB:db(),LOCAL_PREVIEW:'true'};const plan=await ensureWeek(env.DB,'2026-10-05');const story=plan.items.find(i=>i.type==='story');
  const response=await worker.fetch(request('/api/items/'+story.id,'PATCH',{storyText:{en:'Approved story text'},version:story.version}),env);
  assert.equal(response.status,200);const saved=await response.json();
  assert.equal(saved.storyText.en,'Approved story text');assert.equal(saved.storyText.fr,story.storyText.fr);
  assert.equal((await ensureWeek(env.DB,plan.week)).items.find(i=>i.id===story.id).storyText.en,'Approved story text');
  assert.equal((await worker.fetch(request('/api/items/'+story.id,'PATCH',{storyText:{en:'x'.repeat(1101)},version:saved.version}),env)).status,400);
});

test('daily upgrade adds weekends once and preserves French story edits',async()=>{
  const {generatePlan}=await import('../server/legacy-planner-v3.mjs');
  const database=db(),old=generatePlan('2026-10-05');
  await database.prepare('INSERT INTO weeks (week,generated_at,engine) VALUES (?,?,?)').bind(old.week,old.generatedAt,old.engine).run();
  const target=old.items.find(i=>i.type==='story');
  for(const item of old.items){const data=item.id===target.id?{...item,storyText:{...item.storyText,fr:'NOTRE TEXTE APPROUVÉ'}}:item;await database.prepare('INSERT INTO items (id,week,data,version) VALUES (?,?,?,?)').bind(item.id,item.week,JSON.stringify(data),1).run();}
  const plan=await ensureWeek(database,old.week);
  assert.equal(plan.items.length,12);assert.equal(plan.items.find(i=>i.id===target.id).storyText.fr,'NOTRE TEXTE APPROUVÉ');
  const weekends=plan.items.filter(i=>i.type==='story'&&i.date>='2026-10-10');assert.equal(weekends.length,2);assert.ok(weekends.every(i=>i.time==='09:00'&&i.publicationLanguage==='fr'));
  assert.deepEqual((await ensureWeek(database,old.week)).items,plan.items);
});
