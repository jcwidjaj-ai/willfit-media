self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// No page caching: private team data stays behind the site's existing access check.
self.addEventListener('push',event=>{
  let payload;try{payload=event.data?.json();}catch{}
  payload??={title:'WillFit',body:'A posting reminder is ready. Open your calendar.',url:'/'};
  let url=new URL('./',self.location.href);
  try{const candidate=new URL(payload.url,self.location.origin);if(candidate.origin===self.location.origin&&candidate.pathname===new URL('./',self.location.href).pathname)url=candidate;}catch{}
  event.waitUntil(self.registration.showNotification(String(payload.title||'WillFit'),{body:String(payload.body||''),icon:new URL('./logo.png',self.location.href).href,badge:new URL('./logo.png',self.location.href).href,tag:String(payload.tag||'willfit-reminder'),data:{url:url.href}}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const target=new URL(event.notification.data?.url||'/',self.location.origin);
    if(target.origin!==self.location.origin||target.pathname!==new URL('./',self.location.href).pathname)return;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin===target.origin){await client.focus();client.postMessage({type:'willfit-open-reminder',url:target.href});return;}
    }
    await self.clients.openWindow(target.href);
  })());
});
