(()=>{
const $=id=>document.getElementById(id),mkb=t=>{const b=document.createElement('button');b.textContent=t;return b};
const st=document.createElement('style');st.textContent=`
#fx{pointer-events:none;overflow:hidden;z-index:4}
.fl{position:absolute;bottom:8px;font-size:30px;animation:fl 2.4s ease-out forwards}
@keyframes fl{0%{transform:translateY(0) scale(.6);opacity:0}10%{opacity:1}100%{transform:translateY(-170px) scale(1.2);opacity:0}}
#rx{display:flex;gap:6px;padding:0 2px}#rx button{flex:1;padding:6px 0;font-size:20px;min-width:0}
#qs{display:none;position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.4);align-items:flex-end;justify-content:center}
#qs.on{display:flex}#qs>.glass{width:100%;max-width:640px;margin:10px;padding:16px;max-height:70dvh;overflow:auto}
.qi{display:flex;align-items:center;gap:8px;padding:6px 0}.qi span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.qi button{padding:6px 12px}.qe{color:var(--mute);padding:10px 0}`;
document.head.appendChild(st);
const W=window.WebSocket,S=W.prototype.send;
W.prototype.send=function(d){if(typeof d==='string'&&d.indexOf('"t":"join"')>0){try{const o=JSON.parse(d);o.pw=($('pw')||{}).value||'';d=JSON.stringify(o)}catch(e){}}return S.call(this,d)};
window.WebSocket=function(u,p){const w=new W(u,p);w.addEventListener('message',e=>{try{on(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=W.prototype;
const tx=o=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify(o))}catch(e){}};
let q=[],ended=null;
function on(m){
 if(m.t==='deny'){toast(m.msg);setTimeout(()=>location.reload(),1800)}
 else if(m.t==='queue'){q=m.q||[];renderQ()}
 else if(m.t==='react')fl(m.e)}
/* password + install */
const go=$('go'),pw=document.createElement('input');pw.id='pw';pw.type='password';pw.placeholder='Password room (opsional)';pw.maxLength=20;pw.autocomplete='off';go.before(pw);
let dp=null;const ib=mkb('📲 Pasang aplikasi');ib.style.display='none';go.after(ib);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;ib.style.display='block'});
ib.onclick=async()=>{if(!dp)return;dp.prompt();try{await dp.userChoice}catch(e){}dp=null;ib.style.display='none'};
addEventListener('appinstalled',()=>ib.style.display='none');
const ml=document.createElement('link');ml.rel='manifest';ml.href='/manifest.json';document.head.appendChild(ml);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
/* reactions */
const rx=document.createElement('div');rx.id='rx';
['❤️','😂','😮','👏','🔥','😢'].forEach(e=>{const b=mkb(e);b.onclick=()=>tx({t:'react',e});rx.appendChild(b)});
$('chat').before(rx);
function fl(e){const s=$('stage');let f=$('fx');if(!f||f.parentNode!==s){f=document.createElement('div');f.id='fx';s.appendChild(f)}
 const d=document.createElement('span');d.className='fl';d.textContent=e;d.style.left=(8+Math.random()*80)+'%';f.appendChild(d);
 setTimeout(()=>d.remove(),2500);while(f.children.length>25)f.firstChild.remove()}
/* playlist */
const row=$('url').parentNode,ba=mkb('＋'),bq=mkb('📜');ba.style.padding=bq.style.padding='12px 14px';row.append(ba,bq);
const qs=document.createElement('div');qs.id='qs';qs.innerHTML='<div class="glass"><b>Antrean video</b><div id="ql"></div><button id="qc" style="width:100%;margin-top:8px">Tutup</button></div>';document.body.appendChild(qs);
$('qc').onclick=()=>qs.classList.remove('on');qs.onclick=e=>{if(e.target===qs)qs.classList.remove('on')};
bq.onclick=()=>{renderQ();qs.classList.add('on')};
ba.onclick=()=>{const v=parse($('url').value);if(!v)return toast('Link tidak valid');tx({t:'qadd',video:v});$('url').value='';toast('Masuk antrean')};
const T=new Map();
function lab(v){if(v.type==='yt'){const k=v.id;if(T.has(k))return T.get(k);T.set(k,'YouTube '+k);
 fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+k)).then(r=>r.json()).then(j=>{if(j.title){T.set(k,j.title);renderQ()}}).catch(()=>{});return T.get(k)}
 try{const u=new URL(v.url);return u.pathname.split('/').pop()||u.hostname}catch(e){return 'Video'}}
function renderQ(){bq.textContent='📜'+(q.length?' '+q.length:'');const l=$('ql');l.innerHTML='';
 if(!q.length){const e=document.createElement('div');e.className='qe';e.textContent='Antrean kosong. Tempel link lalu ketuk ＋';l.appendChild(e);return}
 q.forEach((v,i)=>{const r=document.createElement('div');r.className='qi';const n=document.createElement('span');n.textContent=(i+1)+'. '+lab(v);
  const p=mkb('▶'),x=mkb('✕');p.disabled=x.disabled=!canAct();
  p.onclick=()=>{act('load',{video:v});qs.classList.remove('on')};x.onclick=()=>tx({t:'qrm',i});r.append(n,p,x);l.appendChild(r)})}
const _ui=window.ui;window.ui=function(){_ui();ba.disabled=!canAct();renderQ()};
setInterval(()=>{if(!q.length||!vid)return;if(host!==me&&mode==='host')return;
 let e=false;try{e=yt?yt.getPlayerState()===0:!!el&&el.ended}catch(x){}
 if(e){if(ended!==1){ended=1;tx({t:'qnext',cur:vid})}}else ended=null},1000);
})();
