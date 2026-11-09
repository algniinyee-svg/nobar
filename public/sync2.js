(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const tx=o=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify(o))}catch(e){}};
const stage=$('stage');
const st=document.createElement('style');st.textContent=`
#tools{display:flex;gap:6px;flex-wrap:wrap;padding:0 2px}#tools button{padding:7px 12px;font-size:13px}
#stage>#holdc{inset:8px auto auto 8px!important;width:auto!important;height:auto!important;z-index:12;display:none;align-items:center;gap:6px;padding:5px 10px;font-size:12px;border-radius:14px;max-width:80%}
#holdc button{padding:2px 9px;font-size:12px}
#stage>#prop{position:absolute!important;inset:8px 8px auto auto!important;width:auto!important;height:auto!important;max-width:62%;z-index:12;padding:5px 8px!important;border-radius:14px!important;font-size:12px;gap:6px!important}
#stage>#prop button{padding:3px 9px!important;font-size:12px}
#stage>#jr{position:absolute!important;inset:46px 8px auto auto!important;width:auto!important;height:auto!important;max-width:72%;z-index:12;padding:0!important;gap:6px;align-items:flex-end}
#stage>#jr .jq{padding:5px 8px;font-size:12px;border-radius:14px;margin:0;width:auto;max-width:none}
#stage>#jr .jq button{padding:3px 9px;font-size:12px}
#stage>#pollc{position:absolute!important;inset:auto auto 56px 8px!important;margin:0!important;width:min(70%,320px)!important;max-width:none!important;height:auto!important;max-height:45%;overflow:auto;z-index:12;padding:8px!important;font-size:12px;gap:4px!important}
#stage>#pollc button{padding:5px 10px;font-size:12px}
#stage>#toast{position:absolute!important;inset:8px auto auto 50%!important;width:auto!important;height:auto!important;z-index:20;font-size:12px;padding:5px 12px}`;
document.head.appendChild(st);
/* ---------- bar alat ---------- */
const ctl=document.querySelector('.ctl'),tools=mk('div');tools.id='tools';ctl.after(tools);window.nbTools=tools;
const rs=mk('button','🔄 Sinkron');
rs.onclick=()=>{if(!sync||!sync.video)return toast('Belum ada video');
 try{const p=expect(sync);window.lastFix=Date.now();yt?yt.seekTo(p,true):(el.currentTime=p);
  if(sync.playing){yt?yt.playVideo():el.play().catch(()=>{})}else{yt?yt.pauseVideo():el.pause()}toast('Disinkronkan ke posisi teman')}catch(e){}};
tools.appendChild(rs);
/* ---------- tunggu bersama (buffering) ---------- */
let holdOn=false;
const hc=mk('div',0,'glass');hc.id='holdc';hc.setAttribute('data-keep','1');
const ht=mk('span'),hs=mk('button','Lanjut');hs.onclick=()=>tx({t:'holdskip'});hc.append(ht,hs);stage.appendChild(hc);
function ahead(){try{
 if(yt){const d=yt.getDuration()||0;return (yt.getVideoLoadedFraction()||0)*d-yt.getCurrentTime()}
 if(el){const b=el.buffered,t=el.currentTime;for(let i=0;i<b.length;i++)if(b.start(i)<=t+.3&&b.end(i)>=t)return b.end(i)-t;return 0}
}catch(e){}return 99}
function starving(){if(!sync||!sync.video||(!yt&&!el))return false;const d=dur();if(d&&d-cur()<6)return false;
 return (sync.playing&&buf())||(holdOn&&ahead()<5)}
let since=0,sent=false;
setInterval(()=>{const s=starving();
 if(s){if(!since)since=Date.now();if(!sent&&(holdOn||Date.now()-since>1500)){sent=true;tx({t:'buf',b:true})}}
 else{since=0;if(sent){sent=false;tx({t:'buf',b:false})}}},500);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{on(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
function on(m){
 if(m.t==='joined'){holdOn=false;sent=false;since=0;hc.style.display='none'}
 else if(m.t==='hold'){holdOn=!!m.on;
  if(m.on){const mine=(m.who||[]).includes(name||USER);ht.textContent=mine?'⏳ Memuat… semua menunggumu':'⏳ Menunggu '+(m.who||[]).join(', ')+' memuat…';hc.style.display='flex'}
  else hc.style.display='none'}
 else if(m.t==='proposal'&&m.p&&m.p.by!==me&&navigator.vibrate){try{navigator.vibrate([60,40,60])}catch(e){}}}
/* ---------- notifikasi kecil di dalam layar penuh ---------- */
const inFS=()=>stage===(document.fullscreenElement||document.webkitFullscreenElement)||stage.classList.contains('pfs');
let was=false;
function move(e){if(!e||e._p)return;e._p=e.parentNode;e._n=e.nextSibling;e.setAttribute('data-keep','1');stage.appendChild(e)}
function back(e){if(!e||!e._p)return;e.removeAttribute('data-keep');const p=e._p,n=e._n;e._p=null;e._n=null;if(n&&n.parentNode===p)p.insertBefore(e,n);else p.appendChild(e)}
function relocate(){const on=inFS();if(on===was)return;was=on;['prop','jr','pollc','toast'].forEach(id=>{const e=$(id);on?move(e):back(e)})}
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev,relocate));
setInterval(relocate,400);
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.id==='pollc'&&was)move(n)}))).observe(document.body,{childList:true});
})();
