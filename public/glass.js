(()=>{
const css=`
:root{--acc:#7fd6ff;--ink:#f6f9ff;--mute:#b9c4e2;--spring:cubic-bezier(.34,1.56,.64,1)}
.glass{position:relative;border:1px solid rgba(255,255,255,.14);
 background:radial-gradient(140% 100% at 0% 0%,rgba(255,255,255,.30),rgba(255,255,255,0) 48%),radial-gradient(90% 70% at 100% 100%,rgba(255,255,255,.10),rgba(255,255,255,0) 55%),linear-gradient(165deg,rgba(255,255,255,.14),rgba(255,255,255,.04) 60%,rgba(255,255,255,.09));
 -webkit-backdrop-filter:blur(20px) saturate(1.9) brightness(1.1);backdrop-filter:blur(20px) saturate(1.9) brightness(1.1);
 box-shadow:inset 1.5px 1.5px 0 rgba(255,255,255,.55),inset -1px -1px 0 rgba(255,255,255,.14),inset 0 0 22px rgba(255,255,255,.05),0 1px 2px rgba(0,0,0,.15),0 16px 36px -12px rgba(2,6,23,.6)}
button{background:radial-gradient(120% 140% at 18% 0%,rgba(255,255,255,.34),rgba(255,255,255,.05) 62%),rgba(255,255,255,.07);
 border:1px solid rgba(255,255,255,.16);-webkit-backdrop-filter:none;backdrop-filter:none;
 box-shadow:inset 1px 1px 0 rgba(255,255,255,.55),inset -1px -1px 0 rgba(255,255,255,.12),0 6px 14px -6px rgba(0,0,0,.5);
 transition:transform .3s var(--spring),box-shadow .2s}
button:active{transform:scale(.93);box-shadow:inset 1px 1px 0 rgba(255,255,255,.7),inset 0 0 18px rgba(255,255,255,.35),0 3px 8px -4px rgba(0,0,0,.5)}
button.pri{background:radial-gradient(120% 140% at 18% 0%,rgba(255,255,255,.45),rgba(255,255,255,0) 60%),linear-gradient(135deg,rgba(104,196,255,.65),rgba(140,120,255,.62))}
input{background:rgba(8,12,28,.32);border:1px solid rgba(255,255,255,.15);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 2px 7px rgba(0,0,0,.38),inset 0 -1px 0 rgba(255,255,255,.08)}
input:focus{border-color:var(--acc);box-shadow:inset 0 2px 7px rgba(0,0,0,.38),0 0 0 3px rgba(127,214,255,.25)}
.m{background:linear-gradient(160deg,rgba(255,255,255,.22),rgba(255,255,255,.07));box-shadow:inset 1px 1px 0 rgba(255,255,255,.4),0 4px 10px -6px rgba(0,0,0,.5)}
.m.me{background:linear-gradient(160deg,rgba(150,225,255,.5),rgba(140,130,255,.3))}
.chips span{background:linear-gradient(160deg,rgba(255,255,255,.18),rgba(255,255,255,.05));box-shadow:inset 1px 1px 0 rgba(255,255,255,.35)}
.ov{position:fixed;inset:0;z-index:80;background:rgba(5,8,20,.5);display:flex;align-items:center;justify-content:center;padding:16px}
.sp{width:100%;max-width:400px;padding:18px;max-height:85dvh;overflow:auto;display:grid;gap:10px}
.sp h4{margin:6px 0 0;color:var(--mute);font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.sp p{margin:0}.sp button{padding:9px 14px}
.sp,#ppl>.glass,#qs>.glass{animation:nbpop .42s var(--spring)}
@keyframes nbpop{from{opacity:0;transform:translateY(18px) scale(.94)}to{opacity:1;transform:none}}
.seg{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:4px;border-radius:999px;user-select:none;-webkit-user-select:none;touch-action:pan-y;
 background:rgba(8,12,28,.34);box-shadow:inset 0 2px 7px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.1),0 1px 0 rgba(255,255,255,.1)}
.seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;border-radius:999px;pointer-events:none;will-change:transform;
 background:radial-gradient(120% 150% at 20% 0%,rgba(255,255,255,.7),rgba(255,255,255,.2) 48%,rgba(255,255,255,.3));
 -webkit-backdrop-filter:blur(3px) saturate(2.2) brightness(1.25);backdrop-filter:blur(3px) saturate(2.2) brightness(1.25);
 box-shadow:inset 0 1.5px 0 rgba(255,255,255,.95),inset 0 -2px 5px rgba(255,255,255,.35),inset 1.5px 0 2px rgba(120,200,255,.6),inset -1.5px 0 2px rgba(255,150,120,.5),0 8px 18px -5px rgba(0,0,0,.5)}
.seg .seg-o{position:relative;z-index:1;background:none;border:0;box-shadow:none;padding:9px 6px;font-size:13px;font-weight:600;color:var(--mute);transition:color .25s}
.seg .seg-o:active{transform:none;box-shadow:none}
.seg .seg-o.on{color:#fff}
.seg.sw .seg-o{display:grid;place-items:center;padding:7px 0}
.dot{display:block;width:22px;height:22px;border-radius:50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.65),0 2px 6px rgba(0,0,0,.45)}
.tg{position:relative;flex:none;width:64px;height:36px;border-radius:999px;cursor:pointer;touch-action:manipulation;
 background:rgba(8,12,28,.38);box-shadow:inset 0 2px 6px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.12);transition:background .4s}
.tg.on{background:linear-gradient(135deg,rgba(94,200,255,.85),rgba(150,125,255,.85))}
.tg-k{position:absolute;top:3px;left:3px;width:42px;height:30px;border-radius:999px;will-change:transform;transition:transform .45s var(--spring);
 background:radial-gradient(120% 150% at 22% 0%,#fff,rgba(255,255,255,.6) 55%,rgba(235,245,255,.85));
 box-shadow:inset 0 1.5px 0 #fff,inset 0 -3px 5px rgba(120,150,200,.35),inset 1px 0 2px rgba(120,200,255,.5),inset -1px 0 2px rgba(255,160,120,.4),0 4px 10px rgba(0,0,0,.4)}
.tg.on .tg-k{transform:translateX(16px)}
.tg.press .tg-k{transform:scale(1.12,.96)}
.tg.on.press .tg-k{transform:translateX(16px) scale(1.12,.96)}
.tg.dis{opacity:.4;pointer-events:none}
input[type=range]{-webkit-appearance:none;appearance:none;height:34px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;--p:50%}
input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:999px;
 background:linear-gradient(90deg,rgba(115,205,255,.9) var(--p),rgba(8,12,28,.4) var(--p));box-shadow:inset 0 1px 3px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.12)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;margin-top:-10px;width:36px;height:30px;border-radius:999px;border:0;
 background:radial-gradient(120% 150% at 22% 0%,#fff,rgba(255,255,255,.6) 55%,rgba(235,245,255,.85));
 box-shadow:inset 0 1.5px 0 #fff,inset 0 -3px 5px rgba(120,150,200,.35),inset 1px 0 2px rgba(120,200,255,.5),inset -1px 0 2px rgba(255,160,120,.4),0 4px 10px rgba(0,0,0,.45);transition:transform .3s var(--spring)}
input[type=range]:active::-webkit-slider-thumb{transform:scale(1.18,.95)}
.ssec{margin:12px 2px 2px;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--mute)}
.sgrp{padding:2px 14px;border-radius:22px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.srow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.srow:last-child{border-bottom:0}
.srow>div:first-child{min-width:0}.srow b{font-size:15px;font-weight:600}
.srow small{display:block;color:var(--mute);font-size:12px;word-break:break-all}
.srow.col{flex-direction:column;align-items:stretch;gap:8px}
@media(prefers-reduced-motion:reduce){.sp,#ppl>.glass,#qs>.glass{animation:none}.tg-k,button{transition:none}}`;
const st=document.createElement('style');st.id='nbglass';st.textContent=css;document.head.appendChild(st);

const mk=(t,x,c)=>{const e=document.createElement(t);if(x!=null&&x!==0)e.textContent=x;if(c)e.className=c;return e};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------- tombol geser: kenop kaca yang memanjang & memantul seperti cairan ---------- */
function seg(opts,val,cb,o){
 o=o||{};
 const el=mk('div',0,'seg'+(o.sw?' sw':''));el.setAttribute('role','radiogroup');
 const th=mk('div',0,'seg-thumb');el.appendChild(th);
 const n=opts.length;
 const btns=opts.map(op=>{const b=mk('button',0,'seg-o');b.type='button';b.setAttribute('role','radio');
  if(op.dot){const d=mk('i',0,'dot');d.style.background=op.dot;b.appendChild(d);b.setAttribute('aria-label',op.l)}else b.textContent=op.l;
  el.appendChild(b);return b});
 let idx=Math.max(0,opts.findIndex(x=>x.v===val)),x=0,v=0,tx=0,w=0,drag=false,press=false,raf=0;
 const measure=()=>{w=(el.clientWidth-8)/n;th.style.width=w+'px'};
 const draw=s=>{const sy=clamp(1-(s-1)*.55,.8,1);th.style.transform='translate3d('+x.toFixed(2)+'px,0,0) scale('+s.toFixed(3)+','+sy.toFixed(3)+')'};
 const mark=()=>btns.forEach((b,i)=>{b.classList.toggle('on',i===idx);b.setAttribute('aria-checked',i===idx)});
 function loop(){
  raf=0;
  if(!drag){v+=(tx-x)*.2;v*=.74;x+=v}
  const s=1+clamp(Math.abs(v)/Math.max(w,1)*1.2,0,.45)+(press?.07:0);
  draw(s);
  if(drag||press||Math.abs(tx-x)>.2||Math.abs(v)>.2)raf=requestAnimationFrame(loop);
  else{x=tx;v=0;draw(1)}}
 const go=()=>{if(!raf)raf=requestAnimationFrame(loop)};
 function setIdx(i,fire){i=clamp(i,0,n-1);const ch=i!==idx;idx=i;tx=i*w;mark();if(reduce){x=tx;v=0;draw(1)}go();if(fire&&ch&&cb)cb(opts[i].v)}
 function ptr(e){const r=el.getBoundingClientRect();const nx=clamp(e.clientX-r.left-4-w/2,0,(n-1)*w);v=nx-x;x=nx}
 el.addEventListener('pointerdown',e=>{if(e.button>0)return;measure();drag=true;press=true;try{el.setPointerCapture(e.pointerId)}catch(_){}ptr(e);go()});
 el.addEventListener('pointermove',e=>{if(drag){ptr(e);go()}});
 const end=()=>{if(!drag)return;drag=false;press=false;setIdx(Math.round(x/(w||1)),true)};
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 el.tabIndex=0;
 el.addEventListener('keydown',e=>{if(e.key==='ArrowRight')setIdx(idx+1,true);else if(e.key==='ArrowLeft')setIdx(idx-1,true)});
 if(window.ResizeObserver)new ResizeObserver(()=>{measure();x=tx=idx*w;v=0;draw(1)}).observe(el);
 requestAnimationFrame(()=>{measure();x=tx=idx*w;mark();draw(1)});
 el.set=v2=>{const i=opts.findIndex(o2=>o2.v===v2);if(i>=0)setIdx(i,false)};
 return el}
/* ---------- saklar ---------- */
function toggle(val,cb){
 const el=mk('div',0,'tg'+(val?' on':''));el.setAttribute('role','switch');el.tabIndex=0;el.setAttribute('aria-checked',!!val);
 el.appendChild(mk('div',0,'tg-k'));
 const set=(v,fire)=>{val=!!v;el.classList.toggle('on',val);el.setAttribute('aria-checked',val);if(fire&&cb)cb(val)};
 el.addEventListener('pointerdown',()=>el.classList.add('press'));
 ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,()=>el.classList.remove('press')));
 el.addEventListener('click',()=>set(!val,true));
 el.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();set(!val,true)}});
 el.set=v=>set(v,false);el.disable=b=>el.classList.toggle('dis',!!b);
 return el}
/* ---------- bantuan susunan ---------- */
function row(label,sub,ctl,col){
 const r=mk('div',0,'srow'+(col?' col':''));const l=mk('div');l.appendChild(mk('b',label));
 if(sub){r.sub=mk('small',sub);l.appendChild(r.sub)}
 r.appendChild(l);if(ctl)r.appendChild(ctl);return r}
const group=(...rows)=>{const g=mk('div',0,'sgrp');rows.forEach(r=>g.appendChild(r));return g};
const sec=t=>mk('div',t,'ssec');
window.NB={mk,seg,toggle,row,group,sec};
/* ---------- isian slider ---------- */
const fill=r=>{const mn=+r.min||0,mx=r.max===''?100:(+r.max||100),p=(r.value-mn)/((mx-mn)||1)*100;r.style.setProperty('--p',clamp(p,0,100)+'%')};
document.addEventListener('input',e=>{if(e.target&&e.target.type==='range')fill(e.target)},true);
setInterval(()=>document.querySelectorAll('input[type=range]').forEach(fill),400);
})();
