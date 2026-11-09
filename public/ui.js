(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const root=document.documentElement;
window.buf=()=>{try{return yt?yt.getPlayerState()===3:!!el&&el.readyState<3}catch(e){return false}};
const st=document.createElement('style');st.textContent=`
#room{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px))}
#room>*{flex-shrink:0}
#chat{flex:none!important;height:62dvh;min-height:300px}
#stage{position:sticky;top:0;z-index:6}
.xb{position:absolute;top:10px;right:10px;z-index:5;width:34px;height:34px;padding:0!important;border-radius:50%;font-size:15px;line-height:1;display:grid;place-items:center}
.sp,#ppl>.glass,#qs>.glass{position:relative;padding-top:50px!important}
#apkbtn{display:none;width:100%;max-width:380px;margin-top:14px;text-decoration:none;text-align:center;padding:13px 16px;border-radius:999px;font-weight:700;color:var(--ink);border:1px solid rgba(255,255,255,.3)}
html.lite .bg::before,html.lite .bg::after{animation:none!important;display:none!important}
html.lite .glass{-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important}
html.lite input,html.lite button{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html.perf .glass{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(28,36,70,.9)!important}`;
document.head.appendChild(st);
/* ---------- mode performa ---------- */
const mode=()=>LS.g('nb-perf')||'auto';
const inRoom=()=>$('room').style.display==='flex';
const weak=(navigator.deviceMemory&&navigator.deviceMemory<=3)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
function applyPerf(){const m=mode(),r=inRoom();
 root.classList.toggle('lite',m==='lite'||(m==='auto'&&r));
 root.classList.toggle('perf',m==='lite'||(m==='auto'&&r&&(weak||LS.g('nb-slow')==='1')))}
setInterval(applyPerf,800);applyPerf();
setInterval(()=>{if(document.hidden||!inRoom()||mode()!=='auto')return;let n=0,t0=0;
 const f=t=>{if(!t0)t0=t;n++;if(t-t0<2500)requestAnimationFrame(f);else if(n*1000/(t-t0)<22)LS.s('nb-slow','1')};requestAnimationFrame(f)},30000);
function perfRow(g){const end=g.lastElementChild,row=mk('div');row.style.cssText='display:flex;gap:6px';
 const mark=()=>[...row.children].forEach(b=>b.className=b.dataset.m===mode()?'pri':'');
 [['auto','Otomatis'],['lite','Ringan'],['full','Penuh']].forEach(([k,l])=>{const b=mk('button',l);b.dataset.m=k;b.style.cssText='flex:1;padding:9px 4px';
  b.onclick=()=>{LS.s('nb-perf',k);if(k==='auto')LS.s('nb-slow','0');mark();applyPerf()};row.appendChild(b)});mark();
 g.insertBefore(mk('h4','Performa'),end);g.insertBefore(row,end);
 g.insertBefore(mk('p','Ringan mematikan animasi dan blur supaya HP yang berat tetap lancar. Otomatis memilihnya sendiri di dalam room.','badge'),end)}
/* ---------- tombol ✕ di sudut jendela melayang ---------- */
function addX(panel,close){if(!panel||panel.querySelector(':scope>.xb'))return;
 const x=mk('button','✕','xb');x.setAttribute('aria-label','Tutup');x.onclick=close;panel.prepend(x);
 panel.querySelectorAll('button').forEach(b=>{if(b!==x&&b.textContent.trim()==='Tutup')b.style.display='none'})}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
 if(n.nodeType===1&&n.classList&&n.classList.contains('ov')){const p=n.querySelector('.sp')||n.firstElementChild;addX(p,()=>n.remove());
  if(/Pengaturan/.test(n.textContent))perfRow(p)}}))).observe(document.body,{childList:true});
try{if($('ppl')&&$('pcl'))addX($('ppl').firstElementChild,()=>$('pcl').click())}catch(e){}
try{if($('qs')&&$('qc'))addX($('qs').firstElementChild,()=>$('qc').click())}catch(e){}
/* ---------- tombol unduh APK di halaman awal ---------- */
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone||document.referrer.startsWith('android-app://');
const ios=/iP(hone|ad|od)/.test(navigator.userAgent);
const sub=document.querySelector('.hero .sub');
if(sub&&!standalone&&!ios){const a=mk('a','📲 Unduh aplikasi Android (APK)','pri');a.id='apkbtn';a.href='/nobar.apk';a.setAttribute('download','Nobar.apk');sub.after(a);
 fetch('/nobar.apk',{method:'HEAD'}).then(r=>{if(r.ok)a.style.display='block'}).catch(()=>{})}
/* ---------- muat modul undangan ---------- */
const iv=document.createElement('script');iv.src='invite.js';iv.async=false;document.body.appendChild(iv);
})();
