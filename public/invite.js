(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const st=document.createElement('style');st.textContent=`
#invs{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:95;display:flex;flex-direction:column;gap:8px;padding:0 12px;pointer-events:none}
.iv{pointer-events:auto;display:flex;align-items:center;gap:8px;padding:10px 12px;max-width:440px;margin:0 auto;width:100%}
.iv span{flex:1;min-width:0;word-break:break-word;font-size:14px}.iv button{padding:7px 12px;font-size:13px}`;
document.head.appendChild(st);
const box=mk('div');box.id='invs';document.body.appendChild(box);
const inRoom=()=>$('room').style.display==='flex';
const inFS=()=>!!(document.fullscreenElement||document.webkitFullscreenElement)||$('stage').classList.contains('pfs');
function pick(inv,url){
 if(inv&&inv.room)return{room:String(inv.room).toUpperCase().slice(0,12),pw:String(inv.pw||'').slice(0,20),from:String(inv.from||'').slice(0,16)};
 const m=String(url||'').match(/#([A-Za-z0-9_-]{1,12})/);return m?{room:m[1].toUpperCase(),pw:'',from:''}:null}
let pend=null,pendAt=0;
function fill(i){const c=$('code');if(c)c.value=i.room;const p=$('pw');if(p)p.value=i.pw||''}
function joinNow(i){
 if(!i)return;
 if(inRoom()){
  if(typeof code!=='undefined'&&code===i.room)return;
  if(!confirm('Pindah ke room '+i.room+'? Kamu akan keluar dari room ini.'))return;
  try{sessionStorage.setItem('nb-pend',JSON.stringify(Object.assign({at:Date.now()},i)))}catch(e){}
  leaving=true;try{ws.close()}catch(e){}location.hash=i.room;location.reload();return}
 pend=i;pendAt=Date.now()}
setInterval(()=>{
 if(!pend)return;
 if(Date.now()-pendAt>20000){pend=null;return}
 const j=$('jcard').style.display,a=$('acard').style.display,g=$('gcard').style.display;
 if(j==='none'&&a==='none'&&g==='none')return;
 fill(pend);
 if($('join').style.display==='none'){pend=null;return}
 if(j!=='none'){pend=null;$('go').click()}
 else{pend=null;toast('Login atau masuk sebagai tamu dulu. Kode dan password room sudah terisi.')}
},500);
function loadPending(){
 try{const s=sessionStorage.getItem('nb-pend');if(s){sessionStorage.removeItem('nb-pend');const j=JSON.parse(s);if(j&&Date.now()-(j.at||0)<120000&&j.room)joinNow(pick(j))}}catch(e){}
 if('caches' in window)caches.open('nb-inv').then(c=>c.match('/__inv').then(async r=>{
  if(!r)return;let j=null;try{j=await r.json()}catch(e){}c.delete('/__inv');
  if(j&&Date.now()-(j.at||0)<600000&&j.room)joinNow(pick(j))})).catch(()=>{})}
loadPending();
function banner(title,body,i,tag){
 if(tag)[...box.children].forEach(b=>{if(b.dataset.tag===tag)b.remove()});
 const d=mk('div',0,'glass iv');d.dataset.tag=tag||'';
 d.appendChild(mk('span',title+': '+body));
 if(i){const b=mk('button',inRoom()?'Pindah':'Gabung','pri');b.onclick=()=>{d.remove();joinNow(i)};d.appendChild(b)}
 const x=mk('button','✕');x.onclick=()=>d.remove();d.appendChild(x);box.appendChild(d);
 if(navigator.vibrate)try{navigator.vibrate([80,40,80])}catch(e){}
 setTimeout(()=>d.remove(),300000);
 if(inFS())toast(title+': '+body)}
const noJoin=t=>t==='chat'||t==='join'||t==='prop'||t==='jr'||t==='mention';
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{
 const m=e.data||{};
 if(m.t==='pushmsg')banner(m.title,m.body,noJoin(m.tag)?null:pick(m.inv,m.url),m.tag);
 else if(m.t==='invite'){const i=pick(m.inv,m.url);if(i)joinNow(i)}});
/* ---------- undangan lewat websocket (kotak masuk) ---------- */
const OW=window.WebSocket,S0=OW.prototype.send;
OW.prototype.send=function(d){if(typeof d==='string'&&d.indexOf('"t":"invite"')>0)d=d.replace('"t":"invite"','"t":"invite2"');return S0.call(this,d)};
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);
 if(m.t==='invite')banner('📨 Undangan Nobar',(m.from||'Seseorang')+' mengajakmu ke room '+m.room+(m.pw?' 🔒':''),{room:String(m.room||'').toUpperCase(),pw:m.pw||'',from:m.from||''},'inv')}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
let ib=null;
function inbox(){
 if(!USER){if(ib){try{ib.close()}catch(e){}ib=null}return}
 if(ib&&ib.readyState<=1)return;
 try{ib=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
  const me=ib;
  me.onopen=()=>{try{me.send(JSON.stringify({t:'hello',token:TOKEN,h:document.hidden}))}catch(e){}};
  me.onclose=()=>{if(ib===me)ib=null}}catch(e){ib=null}}
setInterval(inbox,5000);inbox();
document.addEventListener('visibilitychange',()=>{if(ib&&ib.readyState===1)try{ib.send(JSON.stringify({t:'vis',h:document.hidden}))}catch(e){}});
/* ---------- hapus notifikasi sistem saat aplikasi terbuka ---------- */
async function clearNotifs(){try{const reg=await navigator.serviceWorker.ready;(await reg.getNotifications()).forEach(n=>n.close())}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)clearNotifs()});
clearNotifs();
/* ---------- modul khusus aplikasi Android ---------- */
const nv=document.createElement('script');nv.src='native.js';document.body.appendChild(nv);
})();
