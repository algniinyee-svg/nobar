(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const tx=o=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify(o))}catch(e){}};
const st=document.createElement('style');st.textContent=`
#stage>#cdn{inset:0;display:none;align-items:center;justify-content:center;font-size:96px;font-weight:800;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.6);background:rgba(0,0,0,.35);z-index:9;pointer-events:none}
#cdn.pop{animation:cdp .9s ease-out}@keyframes cdp{from{transform:scale(1.7);opacity:0}30%{opacity:1}to{transform:scale(1)}}
#pollc{position:fixed;top:calc(env(safe-area-inset-top,0px) + 64px);left:12px;right:12px;max-width:420px;margin:0 auto;z-index:70;display:grid;gap:8px;padding:12px}
#pollc button{text-align:left;padding:9px 14px;border-radius:16px}.ph{display:flex;justify-content:space-between;align-items:center}
#seats{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px 4px 12px}
.seat{position:relative;width:58px;text-align:center}
.seat::after{content:"";position:absolute;left:3px;right:3px;top:26px;height:28px;border-radius:14px 14px 8px 8px;background:linear-gradient(rgba(255,255,255,.24),rgba(255,255,255,.06));z-index:0}
.seat .av{position:relative;z-index:1;width:44px;height:44px;margin:0 auto;border-radius:50%;background:rgba(255,255,255,.18) center/cover no-repeat;border:2px solid rgba(255,255,255,.35);display:grid;place-items:center;font-weight:700}
.seat b{position:relative;z-index:1;display:block;margin-top:6px;font:11px/1.2 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seat.spk .av{box-shadow:0 0 0 2px #7fd6ff,0 0 14px #7fd6ff}
.seat .cr{position:absolute;top:-9px;right:2px;z-index:3;font-size:14px}
.seat .rx{position:absolute;left:50%;top:0;z-index:4;font-size:24px;transform:translateX(-50%);animation:rxp 1.8s ease-out forwards;pointer-events:none}
@keyframes rxp{to{transform:translate(-50%,-48px);opacity:0}}`;
document.head.appendChild(st);
let Q=[],lastPoll=null,myVote=-1,tickT=0;
/* ---------- hitung mundur ---------- */
function cdShow(n){const s=$('stage');let o=$('cdn');if(!o||o.parentNode!==s){o=document.createElement('div');o.id='cdn';s.appendChild(o)}
 o.textContent=n>0?n:'▶';o.className='';void o.offsetWidth;o.className='pop';o.style.display='flex';clearTimeout(cdShow.h);cdShow.h=setTimeout(()=>o.style.display='none',n>0?1000:700);
 if(n>0&&navigator.vibrate)try{navigator.vibrate(40)}catch(e){}}
const ctl=document.querySelector('.ctl'),cb=mk('button','⏱');cb.title='Mulai bareng';cb.style.padding='10px 12px';
ctl.insertBefore(cb,ctl.lastElementChild);cb.onclick=()=>tx({t:'cdstart'});
setInterval(()=>{cb.disabled=!canAct()},700);
/* ---------- voting film ---------- */
const urow=$('url').parentNode,vb=mk('button','🗳');vb.title='Voting film';vb.style.padding='12px 14px';urow.appendChild(vb);
vb.onclick=()=>{if(Q.length<2)return toast('Butuh minimal 2 video di antrean');tx({t:'pollstart'})};
const T=new Map();
function title(v){if(v.type!=='yt')return 'Video link';const k=v.id;if(T.has(k))return T.get(k);T.set(k,'YouTube '+k);
 fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+k)).then(r=>r.json()).then(j=>{if(j.title){T.set(k,j.title);if(lastPoll)drawPoll()}}).catch(()=>{});return T.get(k)}
function tick(){const el=$('pollt');if(!el||!lastPoll)return;el.textContent=Math.max(0,Math.ceil((lastPoll.end-Date.now())/1000))+' dtk'}
function drawPoll(){let c=$('pollc');const p=lastPoll;
 if(!p){if(c)c.remove();clearInterval(tickT);return}
 if(!c){c=mk('div',0,'glass');c.id='pollc';document.body.appendChild(c)}
 c.innerHTML='';const h=mk('div',0,'ph'),sec=mk('span','','badge');sec.id='pollt';h.append(mk('b','🗳 Voting film'),sec);c.appendChild(h);
 p.opts.forEach((v,i)=>{const b=mk('button',(i+1)+'. '+title(v)+' · '+p.counts[i]+' suara',i===myVote?'pri':'');b.onclick=()=>{myVote=i;tx({t:'pollvote',i});drawPoll()};c.appendChild(b)});
 if(canAct()){const x=mk('button','Batalkan voting','lnk');x.style.textAlign='center';x.onclick=()=>tx({t:'pollcancel'});c.appendChild(x)}
 tick();clearInterval(tickT);tickT=setInterval(tick,500)}
/* ---------- kursi bioskop ---------- */
const seats=mk('div');seats.id='seats';$('stage').after(seats);
const AV=new Map();
function avatarFor(name,el){if(!ACC||!TOKEN)return;const k=name.toLowerCase(),c=AV.get(k);
 if(c&&Date.now()-c.t<120000){if(c.u){el.style.backgroundImage='url("'+c.u+'")';el.textContent=''}return}
 fetch('/api/avatar?u='+encodeURIComponent(name),{headers:{Authorization:'Bearer '+TOKEN}}).then(async r=>{const u=r.ok?URL.createObjectURL(await r.blob()):null;AV.set(k,{u,t:Date.now()});
  if(u){el.style.backgroundImage='url("'+u+'")';el.textContent=''}}).catch(()=>{})}
function renderSeats(list,hostId){const ids=new Set(list.map(x=>String(x.id)));
 [...seats.children].forEach(e=>{if(!ids.has(e.dataset.id))e.remove()});
 list.forEach(x=>{let e=seats.querySelector('.seat[data-id="'+x.id+'"]');
  if(!e){e=mk('div',0,'seat');e.dataset.id=x.id;const a=mk('div',(x.name[0]||'?').toUpperCase(),'av');e.append(a,mk('b'),mk('span','','cr'));seats.appendChild(e);avatarFor(x.name,a)}
  e.querySelector('b').textContent=x.id===me?'Kamu':x.name;e.querySelector('.cr').textContent=x.id===hostId?'👑':''})}
function pop(id,emo){const s=seats.querySelector('.seat[data-id="'+id+'"]');if(!s)return;const r=mk('span',emo,'rx');s.appendChild(r);setTimeout(()=>r.remove(),1900)}
/* ---------- pesan dari server ---------- */
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{on(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
function on(m){
 if(m.t==='members')renderSeats(m.list,m.host);
 else if(m.t==='react')pop(m.id,m.e);
 else if(m.t==='queue')Q=m.q||[];
 else if(m.t==='cd')cdShow(m.n);
 else if(m.t==='poll'){if(m.p){if(!lastPoll)myVote=-1;lastPoll=Object.assign({},m.p,{end:Date.now()+m.p.left})}else{lastPoll=null;myVote=-1;if(m.res)toast(m.res)}drawPoll()}}
})();
