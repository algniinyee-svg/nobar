self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
self.addEventListener('push',e=>{
 let d={};try{d=e.data.json()}catch(x){}
 e.waitUntil((async()=>{
  const cl=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const vis=cl.filter(c=>c.visibilityState==='visible');
  if(vis.length){vis.forEach(c=>c.postMessage({t:'pushmsg',title:d.title||'Nobar',body:d.body||'',url:d.url||'/',inv:d.inv||null,tag:d.tag||''}));return}
  await self.registration.showNotification(d.title||'Nobar',{body:d.body||'',tag:d.tag||'nobar',renotify:true,icon:'/icon-192.png',badge:'/icon-192.png',vibrate:[120,60,120],data:{url:d.url||'/',inv:d.inv||null}});
 })());
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 const dt=e.notification.data||{},url=dt.url||'/',inv=dt.inv||null;
 e.waitUntil((async()=>{
  const cl=await clients.matchAll({type:'window',includeUncontrolled:true});
  if(cl.length){const c=cl.find(x=>x.visibilityState==='visible')||cl[0];c.postMessage({t:'invite',inv,url});if('focus' in c)return c.focus();return}
  const m=String(url).match(/#([A-Za-z0-9_-]{1,12})/);
  const data=inv&&inv.room?Object.assign({at:Date.now()},inv):(m?{at:Date.now(),room:m[1].toUpperCase(),pw:''}:null);
  if(data){const ch=await caches.open('nb-inv');await ch.put('/__inv',new Response(JSON.stringify(data)))}
  return clients.openWindow(url);
 })());
});
