(()=>{
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
