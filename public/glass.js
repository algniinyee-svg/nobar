(()=>{
const css=`
:root{
 --bg0:#05070c;--bg1:#0a0f1a;--bgc:#070a12;
 --acc:#7fd6ff;--acc-ink:#04121f;--acc-soft:rgba(127,214,255,.16);--acc-line:rgba(127,214,255,.42);
 --ink:#f3f6ff;--ink2:#c3ccdf;--mute:#9aa6c2;
 --glass-fill:rgba(255,255,255,.07);--glass-line:rgba(255,255,255,.14);
 --r-sm:14px;--r-md:20px;--r-lg:28px;
 --spring:cubic-bezier(.34,1.56,.64,1);--ease:cubic-bezier(.2,.8,.2,1);
 --amb:rgba(61,123,255,.23);
 --glass:var(--glass-fill);--edge:var(--glass-line)}
html,body{background:var(--bg0)}
body{color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:-.005em;-webkit-font-smoothing:antialiased}
.bg{background:radial-gradient(120% 55% at 50% -12%,var(--amb),transparent 62%),radial-gradient(80% 45% at 105% 105%,rgba(127,214,255,.07),transparent 60%),linear-gradient(180deg,var(--bg1),var(--bg0))!important}
.bg::before,.bg::after{display:none!important;animation:none!important}
/* ---------- bahan kaca ---------- */
.glass{border-radius:var(--r-lg);border:1px solid var(--glass-line);
 background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.045));
 -webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 .5px rgba(255,255,255,.04),0 12px 32px -14px rgba(0,0,0,.7)}
/* ---------- tombol & kolom ketik ---------- */
button{font-family:inherit;color:var(--ink);border:1px solid var(--glass-line);background:rgba(255,255,255,.085);
 -webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.22);
 transition:transform .25s var(--spring),background .2s,box-shadow .2s}
button:active{transform:scale(.95);background:rgba(255,255,255,.14)}
button.pri{background:linear-gradient(180deg,#9fe3ff,#6cc8f6);color:var(--acc-ink);border-color:rgba(255,255,255,.45);font-weight:700;
 box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 8px 20px -8px rgba(80,180,240,.6)}
button.pri:active{background:linear-gradient(180deg,#8fdcff,#5cbcf0)}
button:disabled{opacity:.4;pointer-events:none}
button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.lnk{background:none!important;border:0!important;box-shadow:none!important;color:var(--acc)!important}
input{font-family:inherit;color:var(--ink);background:rgba(0,0,0,.3);border:1px solid var(--glass-line);
 -webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:inset 0 1px 3px rgba(0,0,0,.45);transition:border-color .2s,box-shadow .2s}
input::placeholder{color:var(--mute)}
input:focus{outline:none;border-color:var(--acc-line);box-shadow:inset 0 1px 3px rgba(0,0,0,.45),0 0 0 3px var(--acc-soft)}
/* ---------- tipografi & elemen umum ---------- */
h1{background:linear-gradient(180deg,#fff 20%,#a9e4ff)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;font-weight:700!important;letter-spacing:-.04em!important}
.badge{color:var(--mute)}
.chips span{color:var(--ink2);border:1px solid var(--glass-line)!important;background:rgba(255,255,255,.05)}
.m{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.m.me{background:var(--acc-soft);border-color:var(--acc-line)}
.m small{color:var(--mute)}
#stage{border:1px solid var(--glass-line)!important;box-shadow:0 18px 50px -20px rgba(0,0,0,.85)!important}
#toast{background:rgba(12,16,28,.92)!important;border:1px solid var(--glass-line)!important;color:var(--ink)}
/* ---------- jendela melayang ---------- */
.ov{position:fixed;inset:0;z-index:80;background:rgba(2,4,10,.62);display:flex;align-items:center;justify-content:center;padding:16px}
.sp{width:100%;max-width:400px;padding:18px;max-height:85dvh;overflow:auto;display:grid;gap:10px}
.sp h4{margin:6px 0 0;color:var(--mute);font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.sp p{margin:0}.sp button{padding:9px 14px}
.sp,#ppl>.glass,#qs>.glass{animation:nbpop .38s var(--spring)}
@keyframes nbpop{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:none}}
/* ---------- tombol geser ---------- */
.seg{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;padding:4px;border-radius:999px;user-select:none;-webkit-user-select:none;touch-action:pan-y;
 background:rgba(0,0,0,.36);box-shadow:inset 0 1px 4px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.09)}
.seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;border-radius:999px;pointer-events:none;will-change:transform;
 background:linear-gradient(180deg,rgba(127,214,255,.34),rgba(127,214,255,.16));border:1px solid var(--acc-line);
 -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 6px 16px -6px rgba(60,160,230,.55)}
.seg .seg-o{position:relative;z-index:1;background:none;border:0;box-shadow:none;padding:9px 6px;font-size:13px;font-weight:600;color:var(--mute);transition:color .25s}
.seg .seg-o:active{transform:none;background:none}
.seg .seg-o.on{color:#fff}
.seg.sw .seg-o{display:grid;place-items:center;padding:7px 0}
.dot{display:block;width:22px;height:22px;border-radius:50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 2px 6px rgba(0,0,0,.5)}
/* ---------- saklar ---------- */
.tg{position:relative;flex:none;width:58px;height:34px;border-radius:999px;cursor:pointer;touch-action:manipulation;
 background:rgba(0,0,0,.4);box-shadow:inset 0 1px 4px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.1);transition:background .35s}
.tg.on{background:linear-gradient(180deg,#9fe3ff,#6cc8f6)}
.tg-k{position:absolute;top:3px;left:3px;width:38px;height:28px;border-radius:999px;will-change:transform;transition:transform .42s var(--spring);
 background:linear-gradient(180deg,#fff,#e6eefb);box-shadow:0 3px 8px rgba(0,0,0,.4),inset 0 -2px 3px rgba(120,150,200,.25)}
.tg.on .tg-k{transform:translateX(14px)}
.tg.press .tg-k{transform:scale(1.1,.96)}
.tg.on.press .tg-k{transform:translateX(14px) scale(1.1,.96)}
.tg.dis{opacity:.4;pointer-events:none}
/* ---------- slider ---------- */
input[type=range]{-webkit-appearance:none;appearance:none;height:34px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;--p:50%}
input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:999px;
 background:linear-gradient(90deg,var(--acc) var(--p),rgba(0,0,0,.4) var(--p));box-shadow:inset 0 1px 3px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.1)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;margin-top:-9px;width:28px;height:26px;border-radius:999px;border:0;
 background:linear-gradient(180deg,#fff,#e6eefb);box-shadow:0 3px 8px rgba(0,0,0,.45),inset 0 -2px 3px rgba(120,150,200,.25);transition:transform .25s var(--spring)}
input[type=range]:active::-webkit-slider-thumb{transform:scale(1.15)}
/* ---------- baris setelan ---------- */
.ssec{margin:12px 2px 2px;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--mute)}
.sgrp{padding:2px 14px;border-radius:var(--r-md);background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09)}
.srow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.srow:last-child{border-bottom:0}
.srow>div:first-child{min-width:0}.srow b{font-size:15px;font-weight:600}
.srow small{display:block;color:var(--mute);font-size:12px;word-break:break-all}
.srow.col{flex-direction:column;align-items:stretch;gap:8px}
@media(prefers-reduced-motion:reduce){.sp,#ppl>.glass,#qs>.glass{animation:none}.tg-k,button{transition:none}}`;
const st=document.createElement('style');st.id='nbglass';st.textContent=css;document.head.appendChild(st);

const mk=(t,x,c)=>{const e=document.createElement(t);if(x!=null&&x!==0)e.textContent=x;if(c)e.className=c;return e};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------- tombol geser ---------- */
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
