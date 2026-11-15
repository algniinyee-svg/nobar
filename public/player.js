(()=>{
const $=id=>document.getElementById(id);
const stage=$('stage'),ctl=document.querySelector('#room .ctl');
if(!stage||!ctl)return;
const IC={
 play:'<path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" fill="#000" stroke="none"/>',
 pause:'<rect x="6" y="4" width="4" height="16" rx="1" fill="#000" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="#000" stroke="none"/>'};
const mask=k=>{const s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'+IC[k]+'</svg>';const u='url("data:image/svg+xml,'+encodeURIComponent(s)+'")';return '-webkit-mask-image:'+u+';mask-image:'+u+';'};
const css=`
/* ---------- bar kontrol kaca di dalam video ---------- */
#stage>.ctl{inset:auto 8px 8px 8px!important;width:auto!important;height:auto!important;z-index:10;padding:5px 8px!important;gap:6px!important;border-radius:22px!important;
 background:linear-gradient(180deg,rgba(14,18,30,.62),rgba(10,14,24,.5))!important;-webkit-backdrop-filter:blur(12px) saturate(1.2)!important;backdrop-filter:blur(12px) saturate(1.2)!important;
 transition:opacity .35s ease,transform .45s cubic-bezier(.2,.8,.2,1)}
#stage.nbhide>.ctl{opacity:0;transform:translateY(14px);pointer-events:none}
#stage>.ctl button{width:36px!important;height:36px;min-height:0!important;padding:0!important}
#stage>.ctl #pp{width:38px!important;height:38px}
#stage>.ctl #tm{font-size:12px;white-space:nowrap;color:#d6deef;font-variant-numeric:tabular-nums}
#stage>.ctl input[type=range]{flex:1;min-width:40px;height:26px!important}
#stage>.ctl input[type=range]::-webkit-slider-runnable-track{height:4px}
#stage>.ctl input[type=range]::-webkit-slider-thumb{width:14px;height:14px;margin-top:-5px;border-radius:50%;transition:transform .2s}
#stage>.ctl input[type=range]:active::-webkit-slider-thumb{transform:scale(1.5)}
/* ---------- tombol putar/jeda di tengah ---------- */
#stage>#cpp{inset:50% auto auto 50%!important;width:64px!important;height:64px!important;margin:-32px 0 0 -32px;border-radius:50%;z-index:9;padding:0!important;display:grid;place-items:center;
 background:rgba(14,18,30,.5)!important;-webkit-backdrop-filter:blur(12px)!important;backdrop-filter:blur(12px)!important;border:1px solid rgba(255,255,255,.22)!important;color:#fff;
 opacity:0;pointer-events:none;transform:scale(.8);transition:opacity .3s,transform .4s cubic-bezier(.34,1.56,.64,1)}
#stage.nbhas:not(.nbhide)>#cpp{opacity:1;pointer-events:auto;transform:none}
#cpp::before{content:"";display:block;width:28px;height:28px;background:currentColor;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain}
#cpp[data-s="play"]::before{${mask('play')}}
#cpp[data-s="pause"]::before{${mask('pause')}}
#cpp:active{transform:scale(.92)!important}
/* ---------- garis progres tipis ---------- */
#stage>#nbprog{inset:auto 0 0 0!important;width:100%!important;height:3px!important;z-index:4;background:rgba(255,255,255,.14);pointer-events:none;opacity:0;transition:opacity .3s}
#nbprog i{display:block;height:100%;width:0;background:#7fd6ff}
#stage.nbhide.nbhas>#nbprog{opacity:1}
/* ---------- elemen lain menyesuaikan ---------- */
#stage:not(.nbhide)>#sub{inset:auto 5% 64px 5%!important}
#stage:not(.nbhide)>#unm{inset:auto auto 66px 50%!important}
#stage:not(.nbhide)>#cbtn{inset:auto 12px 68px auto!important}
#stage:not(.nbhide)>#cine{inset:auto 12px 122px 12px!important}
#stage>#crow{z-index:14!important}
#stage.pfs>.ctl,#stage:fullscreen>.ctl,#stage:-webkit-full-screen>.ctl{left:12px!important;right:12px!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important}
/* ---------- mode hemat: tanpa blur di atas video ---------- */
html.lite #stage>.ctl,html.lite #stage>#cpp{-webkit-backdrop-filter:blur(6px)!important;backdrop-filter:blur(6px)!important}
html.perf #stage>.ctl,html.perf #stage>#cpp{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(16,20,32,.88)!important}
@media(prefers-reduced-motion:reduce){#stage>.ctl,#stage>#cpp,#stage>#nbprog{transition:none}}`;
const st=document.createElement('style');st.id='nbplayer';st.textContent=css;document.head.appendChild(st);
/* pindahkan bar kontrol ke dalam video (tombol, ID, dan aksinya tetap sama) */
ctl.setAttribute('data-keep','1');stage.appendChild(ctl);
const cpp=document.createElement('button');cpp.id='cpp';cpp.type='button';cpp.setAttribute('data-keep','1');cpp.setAttribute('aria-label','Putar atau jeda');cpp.dataset.s='play';stage.appendChild(cpp);
const pg=document.createElement('div');pg.id='nbprog';pg.setAttribute('data-keep','1');const pb=document.createElement('i');pg.appendChild(pb);stage.appendChild(pg);
let last=Date.now();
const bump=()=>{last=Date.now()};
cpp.onclick=e=>{e.stopPropagation();const p=$('pp');if(p&&!p.disabled)p.click();bump()};
stage.addEventListener('pointerdown',bump,true);
stage.addEventListener('pointermove',bump,true);
/* ketuk video: tampilkan atau sembunyikan kontrol */
stage.addEventListener('click',e=>{
 if(!e.target||e.target.id!=='shield')return;
 if(stage.classList.contains('nbhide'))bump();
 else if(typeof playing!=='undefined'&&playing)last=0});
/* tampil/sembunyi otomatis */
setInterval(()=>{
 const has=typeof vid!=='undefined'&&!!vid,pl=typeof playing!=='undefined'&&playing,drag=typeof dragging!=='undefined'&&dragging;
 const hide=has&&pl&&!drag&&Date.now()-last>3200;
 stage.classList.toggle('nbhide',!!hide);
 stage.classList.toggle('nbhas',has);
 cpp.dataset.s=pl?'pause':'play';
 try{const d=dur(),c=cur();pb.style.width=d?Math.max(0,Math.min(100,c/d*100))+'%':'0'}catch(e){}
},250);
const u=$('url');if(u)u.placeholder='Tempel link';
})();
