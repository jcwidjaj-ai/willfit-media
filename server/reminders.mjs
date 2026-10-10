import {sendPush,validateSubscription,decode64} from './web-push.mjs';
import {dueItems,reminderSlot,notificationFor} from '../public/reminder-model.mjs';
import {kinshasaDate,mondayOf} from '../public/planner.mjs';
export const pushConfigured=env=>env.LOCAL_PREVIEW!=='true'&&Boolean(env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_KEY);
export async function subscriptionId(endpoint){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint));return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function saveSubscription(db,input,origin,now=new Date()){
  if(!['en','fr'].includes(input?.language))throw new Error('Invalid language');
  const subscription=validateSubscription(input.subscription),id=await subscriptionId(subscription.endpoint);
  await crypto.subtle.importKey('raw',decode64(subscription.keys.p256dh),{name:'ECDH',namedCurve:'P-256'},false,[]);
  await db.prepare('INSERT INTO push_subscriptions (id,subscription,language,origin,created_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,language=excluded.language,origin=excluded.origin').bind(id,JSON.stringify(subscription),input.language,origin,now.toISOString()).run();
  return id;
}
export async function dispatchReminders(env,now,ensureWeek,send=sendPush){
  if(!pushConfigured(env)||!env.TEAM_KEY)return;
  const {results:devices}=await env.DB.prepare('SELECT * FROM push_subscriptions').all();
  if(!devices.length)return;
  const plan=await ensureWeek(env.DB,mondayOf(kinshasaDate(now)),now);
  const items=dueItems(plan.items,now);
  for(const device of devices)for(const item of items){
    const slot=reminderSlot(item),stamp=now.toISOString(),retryBefore=new Date(now.getTime()-90000).toISOString();
    const claimed=await env.DB.prepare("INSERT INTO push_deliveries (subscription_id,slot,state,attempted_at) VALUES (?,?,'sending',?) ON CONFLICT(subscription_id,slot) DO UPDATE SET state='sending',attempted_at=excluded.attempted_at,attempts=push_deliveries.attempts+1 WHERE push_deliveries.state != 'sent' AND push_deliveries.attempted_at < ? AND push_deliveries.attempts < 3").bind(device.id,slot,stamp,retryBefore).run();
    if(claimed.meta.changes!==1)continue;
    try{
      const payload=notificationFor(item,device.language);
      payload.url=new URL(payload.url,device.origin).href;
      const response=await send(JSON.parse(device.subscription),payload,env,now);
      if(response.status===404||response.status===410){await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(device.id).run();break;}
      await env.DB.prepare('UPDATE push_deliveries SET state = ? WHERE subscription_id = ? AND slot = ? AND attempted_at = ?').bind(response.ok?'sent':'failed',device.id,slot,stamp).run();
    }catch{
      await env.DB.prepare("UPDATE push_deliveries SET state = 'failed' WHERE subscription_id = ? AND slot = ? AND attempted_at = ?").bind(device.id,slot,stamp).run();
    }
  }
  await env.DB.prepare('DELETE FROM push_deliveries WHERE attempted_at < ?').bind(new Date(now.getTime()-30*86400000).toISOString()).run();
}
