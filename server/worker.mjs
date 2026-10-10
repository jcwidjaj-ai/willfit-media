import {pushConfigured,saveSubscription,subscriptionId,dispatchReminders} from './reminders.mjs';
import {sendPush} from './web-push.mjs';
import {generatePlan as generateLegacyPlan} from './legacy-planner-v2.mjs';
import {generatePlan as generateV3Plan} from './legacy-planner-v3.mjs';
import {generatePlan, holidaysForWeek, kinshasaDate, mondayOf, plusDays, validMonday, normalizeCaption, ENGINE} from '../public/planner.mjs';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function authorized(request,env){
  if(env.LOCAL_PREVIEW==='true')return true;
  if(!env.TEAM_KEY)return false;
  const match=(request.headers.get('cookie')||'').match(/(?:^|;\s*)wf_session=([a-f0-9]{64})/);
  return Boolean(match && match[1]===await hash(env.TEAM_KEY));
}
export async function ensureWeek(db,week,now=new Date()){
  let row=await db.prepare('SELECT * FROM weeks WHERE week = ?').bind(week).first();
  if(!row){
    const plan=generatePlan(week,now);
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO weeks (week, generated_at, engine) VALUES (?, ?, ?)').bind(week,plan.generatedAt,plan.engine),
      ...plan.items.map(item=>db.prepare('INSERT OR IGNORE INTO items (id, week, data) VALUES (?, ?, ?)').bind(item.id,week,JSON.stringify(item)))
    ]);
    row=await db.prepare('SELECT * FROM weeks WHERE week = ?').bind(week).first();
  }
  let results=await db.prepare('SELECT id, data, version FROM items WHERE week = ?').bind(week).all();
  const fresh=row.engine!==ENGINE?generatePlan(week,now):null;
  const legacy=fresh?(row.engine==='editorial-library-v3'?generateV3Plan(week,now):generateLegacyPlan(week,now)):null;
  const updates=[];
  for(const record of results.results){
    const original=JSON.parse(record.data);
    const previous=legacy?.items.find(i=>i.id===record.id);
    const unchanged=previous&&['title','brief','caption',...(previous.storyText?['storyText']:[])].every(key=>['en','fr'].every(language=>original[key]?.[language]===previous[key]?.[language]));
    const upgraded=fresh&&(record.version===0||unchanged)?fresh.items.find(i=>i.id===record.id):original;
    const next={...upgraded,date:fresh&&unchanged&&original.date===previous.date?upgraded.date:original.date,time:original.time,posted:original.posted,mediaUrl:original.mediaUrl,note:original.note,caption:{...upgraded.caption,en:normalizeCaption(upgraded.caption.en),fr:normalizeCaption(upgraded.caption.fr)}};
    if(JSON.stringify(next)!==record.data)updates.push(db.prepare('UPDATE items SET data = ?, version = version + 1 WHERE id = ? AND version = ?').bind(JSON.stringify(next),record.id,record.version));
  }
  if(fresh){
    for(const item of fresh.items)if(!results.results.some(r=>r.id===item.id))updates.push(db.prepare('INSERT OR IGNORE INTO items (id, week, data) VALUES (?, ?, ?)').bind(item.id,week,JSON.stringify(item)));
    updates.push(db.prepare('UPDATE weeks SET engine = ? WHERE week = ?').bind(ENGINE,week));
  }
  if(updates.length){await db.batch(updates);results=await db.prepare('SELECT id, data, version FROM items WHERE week = ?').bind(week).all();}
  if(fresh)row.engine=ENGINE;
  return {week,generatedAt:row.generated_at,engine:row.engine,holidays:holidaysForWeek(week),items:results.results.map(r=>({...JSON.parse(r.data),version:r.version})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))};
}
function validatePatch(body,item){
  if(!body || typeof body!=='object'||Array.isArray(body)||!Number.isInteger(body.version))throw new Error('Invalid update');
  const allowed=new Set(['version','posted','title','caption','brief','storyText','note','mediaUrl','date','time']);
  if(Object.keys(body).some(key=>!allowed.has(key)))throw new Error('Unknown field');
  const out={...item};
  if('posted'in body){if(typeof body.posted!=='boolean')throw new Error('Invalid status');out.posted=body.posted;}
  if('storyText' in body&&item.type!=='story')throw new Error('Story text is only available for stories');
  for(const key of ['title','caption','brief','storyText'])if(key in body){
    if(!body[key]||typeof body[key]!=='object'||Array.isArray(body[key])||Object.keys(body[key]).some(k=>!['en','fr'].includes(k)))throw new Error('Invalid translated text');
    out[key]={...item[key]};
    for(const lang of ['en','fr'])if(lang in body[key]){if(typeof body[key][lang]!=='string'||body[key][lang].length>(key==='caption'?2200:key==='title'?300:key==='storyText'?1100:3000))throw new Error('Text is too long');out[key][lang]=body[key][lang];}
  }
  for(const key of ['note','mediaUrl'])if(key in body){if(typeof body[key]!=='string'||body[key].length>(key==='note'?3000:2000))throw new Error('Invalid field');out[key]=body[key];}
  if(out.mediaUrl){let url;try{url=new URL(out.mediaUrl);}catch{throw new Error('Invalid media link');}if(url.protocol!=='https:')throw new Error('Use an HTTPS media link');}
  if('date'in body){if(typeof body.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.date)||Number.isNaN(Date.parse(body.date+'T12:00:00Z'))||new Date(body.date+'T12:00:00Z').toISOString().slice(0,10)!==body.date||body.date<item.week||body.date>plusDays(item.week,6))throw new Error('Date must be in this week');out.date=body.date;}
  if('time'in body){if(typeof body.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time))throw new Error('Invalid time');out.time=body.time;}
  out.caption={en:normalizeCaption(out.caption.en),fr:normalizeCaption(out.caption.fr)};
  if(Object.values(out.caption).some(caption=>caption.length>2200))throw new Error('Caption including the contact footer is too long');
  return out;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
    if(request.headers.get('content-length') && Number(request.headers.get('content-length'))>20000)return json({error:'Request too large'},413);
    if(!['GET','HEAD'].includes(request.method) && request.headers.get('origin')!==url.origin)return json({error:'Invalid origin'},403);
    if(url.pathname==='/api/access' && request.method==='POST'){
      if(!env.TEAM_KEY && env.LOCAL_PREVIEW!=='true')return json({error:'Team access has not been configured'},503);
      let body;try{body=await request.json();}catch{return json({error:'Invalid request'},400);}
      if(env.LOCAL_PREVIEW!=='true' && (typeof body.code!=='string'||body.code!==env.TEAM_KEY))return json({error:'Incorrect team code'},401);
      const res=json({ok:true});res.headers.set('Set-Cookie',`wf_session=${await hash(env.TEAM_KEY||'preview')}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);return res;
    }
    if(!await authorized(request,env))return json({error:env.TEAM_KEY?'Team access required':'Team access has not been configured'},env.TEAM_KEY?401:503);
    if(!env.DB)return json({error:'Shared database has not been connected'},503);
    try{
      if(url.pathname==='/api/reminders/config'&&request.method==='GET')return json({ready:pushConfigured(env),publicKey:pushConfigured(env)?env.VAPID_PUBLIC_KEY:null});
      if(url.pathname.startsWith('/api/reminders/')&&request.method==='POST'){
        let body;try{body=await request.json();}catch{return json({error:'Invalid request'},400);}
        if(url.pathname==='/api/reminders/unsubscribe'){
          if(typeof body?.endpoint!=='string'||body.endpoint.length>2000)return json({error:'Invalid endpoint'},400);
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(await subscriptionId(body.endpoint)).run();return json({ok:true});
        }
        if(!pushConfigured(env))return json({error:'Posting reminders will be available after deployment and push setup.'},503);
        if(url.pathname==='/api/reminders/subscribe'){
          try{await saveSubscription(env.DB,body,url.origin);return json({ok:true});}catch{return json({error:'Invalid browser subscription'},400);}
        }
        if(url.pathname==='/api/reminders/test'){
          if(typeof body?.endpoint!=='string'||body.endpoint.length>2000)return json({error:'Invalid endpoint'},400);
          const device=await env.DB.prepare('SELECT * FROM push_subscriptions WHERE id = ?').bind(await subscriptionId(body.endpoint)).first();
          if(!device)return json({error:'Enable reminders on this device first'},404);
          const fr=device.language==='fr';
          const response=await sendPush(JSON.parse(device.subscription),{title:fr?'WillFit · Rappels activés':'WillFit · Reminders enabled',body:fr?'Vous recevrez un rappel à l’heure prévue pour chaque publication et story.':'You’ll receive a reminder at the scheduled time for each post and story.',url:new URL('/',url.origin).href,tag:'willfit-test'},env);
          if(!response.ok)return json({error:'The push service could not deliver the test. Try again.'},502);
          return json({ok:true});
        }
        return json({error:'Not found'},404);
      }
      if(url.pathname==='/api/plan' && request.method==='GET'){
        const week=url.searchParams.get('week')||mondayOf();
        if(!validMonday(week))return json({error:'Invalid week'},400);
        const plan=await ensureWeek(env.DB,week);
        return json({...plan,mode:env.LOCAL_PREVIEW==='true'?'local-preview':'shared',publishing:'manual',schedule:env.LOCAL_PREVIEW==='true'?'preview':'sunday-0600-kinshasa'});
      }
      if(url.pathname.startsWith('/api/items/') && request.method==='PATCH'){
        const id=decodeURIComponent(url.pathname.slice('/api/items/'.length));
        const row=await env.DB.prepare('SELECT data, version FROM items WHERE id = ?').bind(id).first();
        if(!row)return json({error:'Content not found'},404);
        let body;try{body=await request.json();}catch{return json({error:'Invalid request'},400);}
        let updated;try{updated=validatePatch(body,JSON.parse(row.data));}catch(e){return json({error:e.message},400);}
        const result=await env.DB.prepare('UPDATE items SET data = ?, version = version + 1 WHERE id = ? AND version = ?').bind(JSON.stringify(updated),id,body.version).run();
        if(result.meta.changes!==1)return json({error:'Someone else changed this item. Reload the week and try again.'},409);
        return json({...updated,version:row.version+1});
      }
      return json({error:'Not found'},404);
    }catch(error){console.error('WillFit request failed',error);return json({error:'Unable to load or save the shared calendar. Please try again.'},503);}
  },
  async scheduled(event,env,ctx){
    const now=new Date(event.scheduledTime);
    ctx.waitUntil((async()=>{
      if(event.cron!=='* * * * *'){
        // 05:00 UTC is 06:00 Sunday in Kinshasa; prepare the coming Monday.
        const date=kinshasaDate(now);await ensureWeek(env.DB,mondayOf(plusDays(date,1)),now);
      }
      await dispatchReminders(env,now,ensureWeek);
    })());
  }
};
