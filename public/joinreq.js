(()=>{
const $=id=>document.getElementById(id);
const st=document.createElement('style');st.textContent=`
#jr{position:fixed;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 60px);z-index:60;display:flex;flex-direction:column;gap:8px;padding:0 12px;pointer-events:none}
.jq{pointer-events:auto;display:flex;align-items:center;gap:8px;padding:10px 14px;max-width:420px;margin:0 auto;width:100%}
.jq span{flex:1;min-width:0;word-break:break-word}.jq button{padding:7px 12px}
#wt{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;background:rgba(5,8,20,.6);padding:20px}
#wt .glass{padding:22px;text-align:center;max-width:320px}#wt p{margin:8px 0 14px}`;
document.head.appendChild(st);
const jr=document.createElement('div');jr.id='jr';document.body.appendChild(jr);
const wt=document.createElement('div');wt.id='wt';
wt.innerHTML='<div class="glass"><b>Menunggu persetujuan host…</b><p class="badge">Kamu pernah dikeluarkan dari room ini. Permintaan masuk sudah dikirim ke host.</p><button id="wc">Batal</button></div>';
document.body.appendChild(wt);
$('wc').onclick=()=>{leaving=true;try{ws.close()}catch(e){}location.replace(location.pathname)};
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{on(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
function on(m){
 if(m.t==='wait')wt.style.display='flex';
 else if(m.t==='approved'){wt.style.display='none';ws.send(JSON.stringify({t:'join',room:code,name,token:TOKEN}))}
 else if(m.t==='deny'||m.t==='joined')wt.style.display='none';
 else if(m.t==='joinreq_clear')jr.innerHTML='';
 else if(m.t==='joinreq')ask(m)}
function ask(m){const d=document.createElement('div');d.className='glass jq';
 const s=document.createElement('span');s.textContent=m.name+' ingin masuk lagi';
 const no=document.createElement('button');no.textContent='Tolak';
 const ok=document.createElement('button');ok.textContent='Terima';ok.className='pri';
 const ans=v=>{ws.send(JSON.stringify({t:'joinans',id:m.id,ok:v}));d.remove()};
 no.onclick=()=>ans(false);ok.onclick=()=>ans(true);d.append(s,no,ok);jr.appendChild(d)}
})();
