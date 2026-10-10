import {dueItems,reminderSlot,notificationFor} from './reminder-model.mjs';
export function createOpenReminders({getPlan,getLanguage,onChange=()=>{},onDue=()=>{},open=()=>{},storage=localStorage,now=()=>new Date(),browser=globalThis}){
  const enabledKey='wf-open-reminders',seenKey='wf-open-reminders-seen';
  let enabled=storage.getItem(enabledKey)==='true',busy=false,error='',registration=null,timer=null,checking=false;
  const permission=()=>browser.Notification?.permission||'unavailable';
  const state=()=>({configured:true,supported:true,enabled,busy,error,permission:permission(),desktop:permission()==='granted'});
  const changed=()=>onChange(state());
  async function prepareBrowserNotifications(){
    if(permission()!=='granted'||!browser.navigator?.serviceWorker||!browser.isSecureContext)return;
    try{await browser.navigator.serviceWorker.register('./reminder-worker.js');registration=await browser.navigator.serviceWorker.ready;}catch{registration=null;}
  }
  async function display(payload){
    onDue(payload);
    if(permission()!=='granted')return;
    try{
      if(registration)await registration.showNotification(payload.title,{body:payload.body,tag:payload.tag,icon:new URL('./logo.png',browser.location.href).href,data:{url:new URL('.'+payload.url,browser.location.href).href}});
      else {const notification=new browser.Notification(payload.title,{body:payload.body,tag:payload.tag,icon:new URL('./logo.png',browser.location.href).href});notification.onclick=()=>{browser.focus?.();open(payload.url);notification.close();};}
    }catch{error='reminderOnScreenOnly';changed();}
  }
  async function claim(item){
    let seen;try{seen=JSON.parse(storage.getItem(seenKey)||'{}');}catch{seen={};}
    const key=reminderSlot(item);if(seen[key])return false;
    const timestamp=now().getTime();seen[key]=timestamp;
    for(const slot of Object.keys(seen))if(timestamp-seen[slot]>14*86400000)delete seen[slot];
    storage.setItem(seenKey,JSON.stringify(seen));return true;
  }
  async function check(){
    enabled=storage.getItem(enabledKey)==='true';
    if(!enabled||checking)return;checking=true;
    try{
      const plan=await getPlan();
      if(!plan)return;
      const run=async()=>{if(storage.getItem(enabledKey)!=='true')return;for(const item of dueItems(plan.items,now(),300000))if(await claim(item))await display(notificationFor(item,getLanguage()));};
      if(browser.navigator?.locks)await browser.navigator.locks.request('willfit-posting-reminders',run);else await run();
    }catch{error='reminderLoadError';changed();}finally{checking=false;}
  }
  async function initialize(){
    if(!timer)timer=browser.setInterval(check,15000);
    await prepareBrowserNotifications();changed();await check();
  }
  async function enable(){
    if(busy)return;
    // Permission is requested directly from the user's button click; in-app alerts work without it.
    let request=Promise.resolve('unavailable');
    try{if(browser.Notification&&browser.isSecureContext)request=browser.Notification.requestPermission();}catch{error='reminderOnScreenOnly';}
    enabled=true;storage.setItem(enabledKey,'true');busy=true;error='';changed();
    try{const result=await request;if(result==='denied')error='reminderOnScreenOnly';await prepareBrowserNotifications();}
    catch{error='reminderOnScreenOnly';}finally{busy=false;changed();await check();}
  }
  async function disable(){enabled=false;storage.setItem(enabledKey,'false');error='';changed();}
  async function test(){
    if(!enabled||busy)return;busy=true;error='';changed();
    const fr=getLanguage()==='fr';
    try{await display({title:fr?'WillFit · Rappel de test':'WillFit · Test reminder',body:fr?'Les rappels fonctionnent tant que ce tableau de bord reste ouvert.':'Reminders work while this dashboard stays open.',tag:'willfit-open-test',url:'/'});}
    finally{busy=false;changed();}
  }
  function stop(){if(timer)browser.clearInterval(timer);timer=null;}
  return {initialize,enable,disable,test,check,stop,state,syncLanguage:async()=>{}};
}
