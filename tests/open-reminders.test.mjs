import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenReminders} from '../public/open-reminders.mjs';
const item={id:'2026-10-05-feed-0',week:'2026-10-05',date:'2026-10-08',time:'09:00',type:'reel',title:{en:'Squat technique',fr:'Technique du squat'}};
function setup(permission='unavailable'){
  const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  const alerts=[],notifications=[];let clock=new Date('2026-10-08T08:00:00Z'),items=[structuredClone(item)];
  const browser={isSecureContext:true,setInterval:()=>1,clearInterval:()=>{},navigator:{},location:{origin:'http://localhost'}};
  if(permission!=='unavailable'){
    browser.Notification=class{static permission=permission;static async requestPermission(){return permission;}constructor(title,options){notifications.push({title,...options});}};
  }
  const client=createOpenReminders({storage,browser,now:()=>clock,getPlan:async()=>({items}),getLanguage:()=> 'fr',onDue:payload=>alerts.push(payload)});
  return {client,alerts,notifications,setClock:value=>clock=new Date(value),move:value=>items[0].time=value};
}
test('open-page alerts are opt-in, work without browser notifications, and are not repeated',async()=>{
  const s=setup();await s.client.initialize();assert.equal(s.alerts.length,0);
  await s.client.enable();assert.equal(s.client.state().enabled,true);assert.equal(s.alerts.length,1);assert.match(s.alerts[0].body,/Technique du squat/);
  await s.client.check();assert.equal(s.alerts.length,1);
  await s.client.disable();s.move('09:01');s.setClock('2026-10-08T08:01:00Z');await s.client.check();assert.equal(s.alerts.length,1);
});
test('denied browser permission still enables dashboard alerts',async()=>{
  const s=setup('denied');await s.client.enable();assert.equal(s.alerts.length,1);assert.equal(s.notifications.length,0);assert.equal(s.client.state().enabled,true);assert.equal(s.client.state().error,'reminderOnScreenOnly');
});
test('browser notifications accompany alerts when allowed, and edited schedules get a new reminder',async()=>{
  const s=setup('granted');await s.client.enable();assert.equal(s.notifications.length,1);assert.equal(s.alerts.length,1);
  s.move('09:02');s.setClock('2026-10-08T08:01:00Z');await s.client.check();assert.equal(s.alerts.length,1);
  s.setClock('2026-10-08T08:02:00Z');await s.client.check();assert.equal(s.alerts.length,2);assert.equal(s.notifications.length,2);
});
test('opening the page late does not send stale reminders, while test alerts still work',async()=>{
  const s=setup();s.setClock('2026-10-08T08:06:00Z');await s.client.enable();assert.equal(s.alerts.length,0);
  await s.client.test();assert.equal(s.alerts.length,1);assert.match(s.alerts[0].title,/test/);
});
