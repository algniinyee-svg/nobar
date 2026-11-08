(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
/* ---------- tema warna ---------- */
const TH={
 aurora:{n:'Aurora',g:['#4f6bff','#00d4b4cc','#c13bffcc','#ff7a59aa'],b:'#0b1020',a:'#7fd6ff'},
 sunset:{n:'Sunset',g:['#ff6a3d','#ffb347cc','#d6336ccc','#ff8fa3aa'],b:'#1a0d12',a:'#ffb38a'},
 ocean:{n:'Ocean',g:['#0099ff','#00e0c6cc','#3a5bffcc','#6ad6ffaa'],b:'#06121f',a:'#7fe3ff'},
 forest:{n:'Forest',g:['#2f9e44','#94d82dcc','#0ca678cc','#5c940daa'],b:'#08140c',a:'#9ae6a0'},
 berry:{n:'Berry',g:['#b197fc','#f06595cc','#7048e8cc','#e64980aa'],b:'#140a1f',a:'#f3a6ff'},
 mono:{n:'Mono',g:['#4a5568','#718096cc','#2d3748cc','#a0aec0aa'],b:'#0c0e12',a:'#e2e8f0'}};
const st=document.createElement('style');st.textContent=`
.bg{background:radial-gradient(45% 35% at 12% 8%,var(--g1,#4f6bff),transparent 70%),radial-gradient(40% 35% at 95% 28%,var(--g2,#00d4b4cc),transparent 70%),radial-gradient(55% 45% at 30% 100%,var(--g3,#c13bffcc),transparent 70%),radial-gradient(35% 30% at 80% 75%,var(--g4,#ff7a59aa),transparent 70%),var(--bgc,#0b1020)!important}
.bg::before{background:radial-gradient(closest-side,var(--g1,#5b7bff),transparent)!important}
.bg::after{background:radial-gradient(closest-side,var(--g3,#c13bff),transparent)!important}
#join{position:relative}#thbtn{position:absolute;top:10px;right:12px;z-index:5;padding:8px 12px}
.thr{display:flex;gap:8px;flex-wrap:wrap}.thr button{width:38px;height:38px;padding:0;border-radius:50%;border:2px solid rgba(255,255,255,.25)}
.thr button.on{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.3)}
.ov{position:fixed;inset:0;z-index:80;background:rgba(5,8,20,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.sp{width:100%;max-width:380px;padding:18px;max-height:85dvh;overflow:auto;display:grid;gap:10px}
.sp h4{margin:6px 0 0;color:var(--mute);font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}.sp p{margin:0}.sp button{padding:9px 14px}`;
document.head.appendChild(st);
function applyTheme(k){const t=TH[k]||TH.aurora,s=document.documentElement.style;
 t.g.forEach((c,i)=>s.setProperty('--g'+(i+1),c));s.setProperty('--bgc',t.b);s.setProperty('--acc',t.a);
 document.body.style.background=t.b;const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t.b;LS.s('nb-th',k)}
applyTheme(TH[LS.g('nb-th')]?LS.g('nb-th'):'aurora');
function themeRow(){const r=mk('div',0,'thr');
 const mark=()=>[...r.children].forEach(b=>b.classList.toggle('on',b.dataset.k===LS.g('nb-th')));
 Object.keys(TH).forEach(k=>{const b=mk('button');b.dataset.k=k;b.title=TH[k].n;b.style.background='linear-gradient(135deg,'+TH[k].g[0]+','+TH[k].g[2]+')';
  b.onclick=()=>{applyTheme(k);mark()};r.appendChild(b)});mark();return r}
const tb=mk('button','🎨');tb.id='thbtn';tb.onclick=()=>{const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');
 g.append(mk('b','Tema warna'),themeRow());const c=mk('button','Tutup');c.onclick=()=>o.remove();g.appendChild(c);o.appendChild(g);o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)};
$('join').appendChild(tb);
/* ---------- push ---------- */
const b64=s=>{const p='='.repeat((4-s.length%4)%4),d=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...d].map(c=>c.charCodeAt(0)))};
const supported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
async function sendSub(sub){const r=await fetch('/api/push/sub',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},body:JSON.stringify({sub:sub.toJSON()})});if(!r.ok)throw'Gagal mendaftarkan push'}
async function pushOn(){
 if(!supported())throw'Browser ini tidak mendukung push';
 if(!TOKEN)throw'Login dulu';
 const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(p!=='granted')throw'Izin notifikasi ditolak';
 const k=(await (await fetch('/api/vapid')).json()).key;if(!k)throw'Push belum aktif di server';
 const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
 if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k)});
 await sendSub(sub);LS.s('nb-p','1')}
async function pushOff(){LS.s('nb-p','0');try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();
 if(sub){await fetch('/api/push/unsub',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},body:JSON.stringify({endpoint:sub.endpoint})});await sub.unsubscribe()}}catch(e){}}
let synced=false;
setInterval(async()=>{if(synced||!USER||LS.g('nb-p')!=='1'||!supported()||Notification.permission!=='granted')return;synced=true;
 try{const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(sub)await sendSub(sub);else LS.s('nb-p','0')}catch(e){synced=false}},4000);
/* ---------- status latar belakang & info ---------- */
const vis=()=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify({t:'vis',h:document.hidden}))}catch(e){}};
document.addEventListener('visibilitychange',vis);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.t==='joined')setTimeout(vis,300);else if(m.t==='info')toast(m.msg)}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
/* ---------- tambahan di panel pengaturan ---------- */
function extras(g){if(!g)return;const end=g.lastElementChild,add=(...n)=>n.forEach(x=>g.insertBefore(x,end));
 add(mk('h4','Tema warna'),themeRow(),mk('h4','Push & undangan'));
 const pb=mk('button');const lab=()=>{pb.textContent=!supported()?'Push tidak didukung':LS.g('nb-p')==='1'?'🔔 Push notifikasi: Aktif':'🔕 Push notifikasi: Mati'};
 pb.onclick=async()=>{if(LS.g('nb-p')==='1'){await pushOff();toast('Push dimatikan')}else{try{await pushOn();toast('Push aktif')}catch(e){toast(typeof e==='string'?e:'Gagal mengaktifkan push')}}lab()};
 lab();
 const ir=mk('div');ir.style.cssText='display:flex;gap:8px';const iu=mk('input');iu.placeholder='Username teman';iu.maxLength=16;iu.autocapitalize='none';iu.autocomplete='off';iu.style.cssText='flex:1;min-width:0';
 const ib=mk('button','Undang','pri');ib.onclick=()=>{const u=iu.value.trim();if(!u)return toast('Isi username teman');try{ws.send(JSON.stringify({t:'invite',to:u}))}catch(e){}iu.value=''};
 ir.append(iu,ib);
 add(pb,ir,mk('p','Push masuk walau Nobar ditutup untuk undangan. Pesan dan aktivitas room masuk selama Nobar masih berjalan di latar belakang. Temanmu harus sudah mengaktifkan push.','badge'))}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.classList&&n.classList.contains('ov')&&/Pengaturan/.test(n.textContent))extras(n.querySelector('.sp'))}))).observe(document.body,{childList:true});
})();
