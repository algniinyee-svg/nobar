(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const TH={
 aurora:{n:'Aurora',g:['#4f6bff','#00d4b4cc','#c13bffcc','#ff7a59aa'],b:'#0b1020',a:'#7fd6ff'},
 sunset:{n:'Sunset',g:['#ff6a3d','#ffb347cc','#d6336ccc','#ff8fa3aa'],b:'#1a0d12',a:'#ffb38a'},
 ocean:{n:'Ocean',g:['#0099ff','#00e0c6cc','#3a5bffcc','#6ad6ffaa'],b:'#06121f',a:'#7fe3ff'},
 forest:{n:'Forest',g:['#2f9e44','#94d82dcc','#0ca678cc','#5c940daa'],b:'#08140c',a:'#9ae6a0'},
 berry:{n:'Berry',g:['#b197fc','#f06595cc','#7048e8cc','#e64980aa'],b:'#140a1f',a:'#f3a6ff'},
 mono:{n:'Mono',g:['#4a5568','#718096cc','#2d3748cc','#a0aec0aa'],b:'#0c0e12',a:'#e2e8f0'}};
const st=document.createElement('style');st.textContent=`
#toast{z-index:999!important}
.bg{background:radial-gradient(45% 35% at 12% 8%,var(--g1,#4f6bff),transparent 70%),radial-gradient(40% 35% at 95% 28%,var(--g2,#00d4b4cc),transparent 70%),radial-gradient(55% 45% at 30% 100%,var(--g3,#c13bffcc),transparent 70%),radial-gradient(35% 30% at 80% 75%,var(--g4,#ff7a59aa),transparent 70%),var(--bgc,#0b1020)!important}
.bg::before{background:radial-gradient(closest-side,var(--g1,#5b7bff),transparent)!important}
.bg::after{background:radial-gradient(closest-side,var(--g3,#c13bff),transparent)!important}
#join{position:relative}#thbtn{position:absolute;top:10px;right:12px;z-index:5;padding:8px 12px}`;
document.head.appendChild(st);
function applyTheme(k){const t=TH[k]||TH.aurora,s=document.documentElement.style;
 t.g.forEach((c,i)=>s.setProperty('--g'+(i+1),c));s.setProperty('--bgc',t.b);s.setProperty('--acc',t.a);
 document.body.style.background=t.b;const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t.b;LS.s('nb-th',k)}
applyTheme(TH[LS.g('nb-th')]?LS.g('nb-th'):'aurora');
window.nbTheme={TH,get:()=>TH[LS.g('nb-th')]?LS.g('nb-th'):'aurora',set:applyTheme};
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
