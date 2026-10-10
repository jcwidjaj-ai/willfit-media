export function decodePushKey(value){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export function createPushClient({api,onChange=()=>{},getLanguage=()=> 'en'}){
  let config=null,registration=null,subscription=null,busy=false,error='';
  const supported=()=>window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  const state=()=>({configured:Boolean(config?.ready),supported:supported(),enabled:Boolean(subscription)&&Notification.permission==='granted',busy,error,permission:typeof Notification==='undefined'?'unavailable':Notification.permission});
  const changed=()=>onChange(state());
  async function initialize(){
    try{
      config=await api('/api/reminders/config');
      if(supported()){
        await navigator.serviceWorker.register('/reminder-worker.js');
        registration=await navigator.serviceWorker.ready;
        subscription=await registration.pushManager.getSubscription();
        if(subscription&&config.ready&&Notification.permission==='granted')await api('/api/reminders/subscribe',{method:'POST',body:JSON.stringify({subscription:subscription.toJSON(),language:getLanguage()})});
      }
    }catch{error='reminderLoadError';}finally{changed();}
  }
  async function enable(){
    if(busy||!config?.ready||!supported()||!registration)return;
    // This request runs immediately in the button's click handler.
    const permissionRequest=Notification.requestPermission();busy=true;error='';changed();
    try{
      const permission=await permissionRequest;
      if(permission!=='granted'){error=permission==='denied'?'reminderDenied':'reminderNotAllowed';return;}
      subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(config.publicKey)});
      try{await api('/api/reminders/subscribe',{method:'POST',body:JSON.stringify({subscription:subscription.toJSON(),language:getLanguage()})});}
      catch{await subscription.unsubscribe();subscription=null;throw new Error();}
    }catch{error='reminderEnableError';}finally{busy=false;changed();}
  }
  async function disable(){
    if(busy||!subscription)return;busy=true;error='';changed();
    try{
      // Remove the server record before unsubscribing; failure leaves a retryable device subscription.
      await api('/api/reminders/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})});
      await subscription.unsubscribe();subscription=null;
    }catch{error='reminderDisableError';}finally{busy=false;changed();}
  }
  async function test(){
    if(busy||!subscription)return;busy=true;error='';changed();
    try{await api('/api/reminders/test',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})});}
    catch{error='reminderTestError';}finally{busy=false;changed();}
  }
  async function syncLanguage(){if(subscription&&config?.ready)try{await api('/api/reminders/subscribe',{method:'POST',body:JSON.stringify({subscription:subscription.toJSON(),language:getLanguage()})});}catch{error='reminderEnableError';changed();}}
  return {initialize,enable,disable,test,syncLanguage,state};
}
