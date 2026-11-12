(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
/* tema hanya mengubah tint cahaya ambient; aksen selalu biru es */
const TH={
 sinema:{n:'Sinema',g:['#3d7bff','#35c7e8','#5b6cff','#7fd6ff']},
 fajar:{n:'Fajar',g:['#ff7a4d','#ffb067','#ff5e8a','#ff9b7a']},
 samudra:{n:'Samudra',g:['#18a3c8','#1fd1c1','#2e7bd6','#6ad6ff']},
 hutan:{n:'Hutan',g:['#2e9e5b','#7ccf5a','#17a98a','#5fbf8f']},
 anggur:{n:'Anggur',g:['#8a6cf0','#d764b8','#6b4de0','#b48cff']},
 mono:{n:'Mono',g:['#5b6577','#7a8599','#3b4352','#9aa5b8']}};
const OLD={aurora:'sinema',sunset:'fajar',ocean:'samudra',forest:'hutan',berry:'anggur'};
const norm=k=>TH[k]?k:(OLD[k]||'sinema');
const st=document.createElement('style');st.textContent=`
#toast{z-index:999!important}
#join{position:relative}#thbtn{position:absolute;top:10px;right:12px;z-index:5;padding:8px 12px}`;
document.head.appendChild(st);
function applyTheme(k){k=norm(k);const t=TH[k],s=document.documentElement.style;
 t.g.forEach((c,i)=>s.setProperty('--g'+(i+1),c));s.setProperty('--amb',t.g[0]+'3a');s.setProperty('--bgc','#070a12');
 const m=document.querySelector('meta[name=theme-color]');if(m)m.content='#05070c';LS.s('nb-th',k)}
applyTheme(LS.g('nb-th')||'sinema');
window.nbTheme={TH,get:()=>norm(LS.g('nb-th')),set:applyTheme};
const tb=mk('button','🎨');tb.id='thbtn';$('join').appendChild(tb);
/* ---------- push (per akun) ---------- */
const b64=s=>{const p='='.repeat((4-s.length%4)%4),d=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...d].map(c=>c.charCodeAt(0)))};
const supported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const withTO=(p,ms,msg)=>Promise.race([p,new Promise((_,rj)=>setTimeout(()=>rj(msg),ms))]);
const hdr=tok=>({'Content-Type':'application/json',Authorization:'Bearer '+tok});
const uk=()=>'nb-p:'+(USER||'').toLowerCase();
const isOn=()=>LS.g(uk())==='1';
const setOn=v=>{LS.s(uk(),v?'1':'0');LS.s('nb-p',v?'1':'0')};
async function sendSub(sub){const r=await fetch('/api/push/sub',{method:'POST',headers:hdr(TOKEN),body:JSON.stringify({sub:sub.toJSON()})});if(!r.ok)throw'Gagal mendaftarkan push ke server'}
async function dropFor(tok){try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
 if(sub)await fetch('/api/push/unsub',{method:'POST',headers:hdr(tok),body:JSON.stringify({endpoint:sub.endpoint})})}catch(e){}}
async function getReg(){let reg=await navigator.serviceWorker.getRegistration();if(!reg)reg=await navigator.serviceWorker.register('/sw.js');
 await withTO(navigator.serviceWorker.ready,6000,'Service worker belum siap. Muat ulang halaman lalu coba lagi');return reg}
async function subscribe(reg,key){
 try{return await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)})}
 catch(e){if(e&&e.name==='NotAllowedError')throw'Izin notifikasi diblokir. Aktifkan lewat pengaturan situs di browser';
  if(e&&e.name==='AbortError'){await wait(1500);try{return await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)})}catch(x){}}
  throw'Layanan push browser gagal ('+((e&&e.name)||'error')+'). Coba lagi, atau pakai Chrome terbaru dengan Google Play Services aktif'}}
async function pushOn(){
 if(!supported())throw'Browser ini tidak mendukung push';
 if(!TOKEN)throw'Login dulu';
 const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(p!=='granted')throw'Izin notifikasi ditolak';
 const k=(await (await fetch('/api/vapid')).json()).key;if(!k)throw'Push belum aktif di server';
 const reg=await getReg();let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await subscribe(reg,k);
 await sendSub(sub);setOn(true)}
async function pushOff(){setOn(false);await dropFor(TOKEN)}
let pu='\u0000',pTok='',synced=false;
setInterval(()=>{
 if(USER!==pu){if(pu!=='\u0000'&&pu&&pTok)dropFor(pTok);pu=USER;synced=false;LS.s('nb-p',USER&&isOn()?'1':'0')}
 if(TOKEN)pTok=TOKEN;
 if(!synced&&USER&&isOn()&&supported()&&Notification.permission==='granted'){synced=true;
  (async()=>{try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub)await sendSub(sub);else setOn(false)}catch(e){synced=false}})()}
},1000);
const vis=()=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify({t:'vis',h:document.hidden}))}catch(e){}};
document.addEventListener('visibilitychange',vis);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);
 if(m.t==='joined')setTimeout(vis,300);else if(m.t==='info'){const s=$('nbst');if(s)s.textContent=m.msg;toast(m.msg)}}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
window.nbPush={on:pushOn,off:pushOff,isOn,supported};
})();
