(()=>{
const $=id=>document.getElementById(id);
const {mk}=window.NB;
/* ---------- pustaka ikon (garis, satu warna) ---------- */
const IC={
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"/>',
 calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55-.47.98-1.97 1.5C7.2 18.8 6 20.1 6 22M14 14.66V17c0 .55.47.98 1.97 1.5C16.8 18.8 18 20.1 18 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
 palette:'<circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.73-.39-1-.23-.27-.38-.62-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9Z"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
 belloff:'<path d="M8.7 3A6 6 0 0 1 18 8c0 3 .5 5.3 1.2 6.8"/><path d="M17 17H3s3-2 3-9c0-.7.1-1.3.3-1.9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M2 2l20 20"/>',
 mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
 micoff:'<path d="M2 2l20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><path d="M12 19v3"/>',
 camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
 timer:'<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
 expand:'<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 vote:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 play:'<path fill="#000" stroke="none" d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/>',
 pause:'<rect x="6" y="4" width="4" height="16" rx="1" fill="#000" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="#000" stroke="none"/>',
 refresh:'<path d="M21 12a9 9 0 0 0-15.5-6.3L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.5 6.3L21 16"/><path d="M16 16h5v5"/>',
 card:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18"/><path d="M7 15h4"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'
};
const wrap=p=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const svg=name=>{const d=document.createElement('div');d.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC[name].replace(/#000/g,'currentColor')+'</svg>';return d.firstChild};
let css='';
for(const k in IC){const u='url("data:image/svg+xml,'+encodeURIComponent(wrap(IC[k]))+'")';css+='[data-ic="'+k+'"]::before{-webkit-mask-image:'+u+';mask-image:'+u+'}'}
css+=`
[data-ic]::before{content:"";display:block;width:20px;height:20px;background:currentColor;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain}
button[data-ic]{font-size:0!important;display:inline-flex!important;align-items:center;justify-content:center;gap:0}
i.ic{display:inline-block;width:18px;height:18px;margin-right:7px;vertical-align:-4px}
i.ic::before{width:18px;height:18px}
html,body,input,button,textarea{font-family:Roboto,"Segoe UI","Helvetica Neue",Arial,system-ui,sans-serif}
body{background:transparent!important}
#tiles:not(:has(.tile:not(.nov))){display:none!important}
#seats{padding:2px 4px 8px!important}
/* ---------- bottom sheet ---------- */
.ov{align-items:flex-end!important;padding:0!important;background:rgba(2,4,10,.55)!important}
.ov>.sp,.ov>.glass{width:100%!important;max-width:520px!important;margin:0 auto!important;border-radius:28px 28px 0 0!important;max-height:88dvh!important;padding-bottom:calc(20px + env(safe-area-inset-bottom,0px))!important;animation:nbsheet .42s cubic-bezier(.34,1.3,.64,1)!important}
@keyframes nbsheet{from{transform:translateY(60%);opacity:0}to{transform:none;opacity:1}}
.sp{padding-top:46px!important}
.grab{position:absolute;top:0;left:0;right:0;height:32px;touch-action:none;z-index:4}
.grab::after{content:"";position:absolute;top:9px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:4px;background:rgba(255,255,255,.3)}
/* ---------- navigasi Home ---------- */
#join{padding-bottom:calc(98px + env(safe-area-inset-bottom,0px))!important}
#hpbtn,#scbtn,#trbtn,#avbtn,#wpbtn,#thbtn{display:none!important}
.nbnav{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(92vw,400px);z-index:70;display:grid;grid-template-columns:repeat(5,1fr);padding:4px;border-radius:999px;transition:transform .38s cubic-bezier(.2,.8,.2,1),opacity .25s}
.nbnav.hide{transform:translate(-50%,150%);opacity:0;pointer-events:none}
.nbnav-t{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/5);border-radius:999px;pointer-events:none;background:linear-gradient(180deg,rgba(127,214,255,.3),rgba(127,214,255,.14));border:1px solid rgba(127,214,255,.42);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 16px -8px rgba(60,160,230,.6);transform:translateX(calc(var(--i,0) * 100%));transition:transform .5s cubic-bezier(.34,1.56,.64,1)}
.nbn{position:relative;z-index:1;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 0 7px;min-height:54px;background:none!important;border:0!important;box-shadow:none!important;border-radius:999px;color:#9aa6c2;font-size:11px!important;font-weight:600}
.nbn svg{width:22px;height:22px}
.nbn.on{color:#fff}
.nbn:active{transform:scale(.92)}
/* ---------- lembar profil ---------- */
.pfh{display:flex;align-items:center;gap:14px;padding:4px 2px 8px}
.pfa{width:64px;height:64px;border-radius:50%;flex:none;background:rgba(255,255,255,.1) center/cover no-repeat;border:2px solid rgba(255,255,255,.3);display:grid;place-items:center;font-size:26px;font-weight:700}
.pfh b{font-size:19px}.pfh small{display:block;color:#9aa6c2;font-size:13px}`;
const st=document.createElement('style');st.id='nbshell';st.textContent=css;document.head.appendChild(st);
/* ---------- emoji pada tombol -> ikon garis (teks asli tidak diubah) ---------- */
const MAP={'🎤':'mic','🔇':'micoff','📷':'camera','👥':'users','⚙️':'sliders','⚙':'sliders','⏱':'timer','⛶':'expand','📜':'list','🗳':'vote','＋':'plus','▶':'play','▶️':'play','❚❚':'pause','🔔':'bell','🔕':'belloff','📅':'calendar','🏆':'trophy','👤':'user','🖼️':'image','🖼':'image','🎨':'palette'};
const LMAP={'🔄':'refresh','🎴':'card'},LBL=/^(🔄|🎴)\s+(.+)$/;
function scan(){
 document.querySelectorAll('button').forEach(b=>{
  if(b.classList.contains('nbn'))return;
  const t=b.textContent.trim(),k=MAP[t];
  if(k){if(b.dataset.ic!==k)b.dataset.ic=k;return}
  if(!b.querySelector('i.ic')){
   const m=t.match(LBL);
   if(m){b.textContent=m[2];const i=document.createElement('i');i.className='ic';i.dataset.ic=LMAP[m[1]];b.insertBefore(i,b.firstChild);return}}
  if(b.dataset.ic)b.removeAttribute('data-ic')})}
setInterval(scan,400);scan();
/* ---------- lembar bawah: geser untuk menutup ---------- */
function sheet(o){
 const p=o.querySelector(':scope>.sp')||o.firstElementChild;
 if(!p||p.querySelector(':scope>.grab'))return;
 const gr=mk('div',0,'grab');p.prepend(gr);
 let y0=0,dy=0,on=false;
 gr.addEventListener('pointerdown',e=>{on=true;y0=e.clientY;dy=0;p.style.transition='none';try{gr.setPointerCapture(e.pointerId)}catch(_){}});
 gr.addEventListener('pointermove',e=>{if(!on)return;dy=Math.max(0,e.clientY-y0);p.style.transform='translateY('+dy+'px)'});
 const end=()=>{if(!on)return;on=false;p.style.transition='transform .3s cubic-bezier(.2,.8,.2,1)';
  if(dy>110){p.style.transform='translateY(110%)';setTimeout(()=>o.remove(),220)}else p.style.transform=''};
 gr.addEventListener('pointerup',end);gr.addEventListener('pointercancel',end)}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1&&n.classList&&n.classList.contains('ov'))sheet(n)}))).observe(document.body,{childList:true});
/* ---------- navigasi kaca mengambang ---------- */
const join=$('join');
const nav=mk('div',0,'nbnav glass'),th=mk('div',0,'nbnav-t');nav.appendChild(th);
const items=[['home','Beranda','home'],['sched','Jadwal','calendar'],['rank','Peringkat','trophy'],['prof','Profil','user'],['theme','Tema','palette']];
const closeAll=()=>document.querySelectorAll('.ov').forEach(e=>e.remove());
const click=id=>{const e=$(id);if(e)e.click()};
const btns=items.map(([k,l,i],n)=>{
 const b=mk('button',0,'nbn');b.type='button';b.setAttribute('aria-label',l);
 b.appendChild(svg(i));b.appendChild(mk('span',l));b.onclick=()=>pick(n,k);nav.appendChild(b);return b});
function setActive(n){nav.style.setProperty('--i',n);btns.forEach((b,j)=>b.classList.toggle('on',j===n))}
function pick(n,k){
 setActive(n);closeAll();
 if(k==='home'){join.scrollTo&&join.scrollTo(0,0);return}
 if(k==='sched')click('scbtn');else if(k==='rank')click('trbtn');else if(k==='theme')click('thbtn');else profile()}
join.appendChild(nav);setActive(0);
let rv=0;
new MutationObserver(()=>{clearTimeout(rv);rv=setTimeout(()=>{if(!document.querySelector('.ov'))setActive(0)},160)}).observe(document.body,{childList:true});
let kb=false;
document.addEventListener('focusin',e=>{if(e.target&&e.target.tagName==='INPUT')kb=true});
document.addEventListener('focusout',()=>setTimeout(()=>{kb=!!(document.activeElement&&document.activeElement.tagName==='INPUT')},120));
setInterval(()=>{const login=$('acard').style.display!=='none'||$('gcard').style.display!=='none';nav.classList.toggle('hide',login||kb)},400);
/* ---------- lembar profil ---------- */
function profile(){
 const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');o.appendChild(g);
 const nm=USER||(GUEST?GUEST+' (tamu)':'Belum masuk');
 const av=mk('div',(nm[0]||'?').toUpperCase(),'pfa'),hd=mk('div',0,'pfh'),tx=mk('div');
 tx.append(mk('b',nm),mk('small',USER?'Akun terdaftar':GUEST?'Masuk sebagai tamu':'Silakan masuk'));hd.append(av,tx);g.appendChild(hd);
 if(USER)fetch('/api/avatar',{headers:{Authorization:'Bearer '+TOKEN}}).then(async r=>{if(r.ok){av.style.backgroundImage='url("'+URL.createObjectURL(await r.blob())+'")';av.textContent=''}}).catch(()=>{});
 const go=id=>{o.remove();click(id)};
 const act=(l,fn,pri)=>{const b=mk('button',l,pri?'pri':'');b.onclick=fn;return b};
 const {row,group,sec}=window.NB;
 g.append(sec('Profil'),group(
  row('Foto profil','Tampil di kursi bioskop',act('Ubah',()=>go('avbtn'))),
  row('Wallpaper','Latar halaman utama',act('Ubah',()=>go('wpbtn'))),
  row('Notifikasi','Undangan dan pengingat',act('Atur',()=>go('hpbtn')))),
  sec('Akun'),group(row(USER||GUEST?'Ganti akun':'Masuk',USER||GUEST?'Keluar dari sesi ini':'Masuk atau daftar',act(USER||GUEST?'Keluar':'Masuk',()=>{o.remove();click('lo');setActive(0)},true))));
 o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
})();
