(()=>{
const $=id=>document.getElementById(id),s=$('stage');
const st=document.createElement('style');st.textContent=`#stage.pfs{position:fixed!important;inset:0;z-index:30;width:100vw;height:100dvh;aspect-ratio:auto;border-radius:0;border:0}`;
document.head.appendChild(st);
const x=document.createElement('button');x.textContent='✕ Tutup';
x.style.cssText='display:none;position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;z-index:40;padding:8px 14px;background:rgba(20,26,48,.85)';
document.body.appendChild(x);
const off=()=>{s.classList.remove('pfs');x.style.display='none'},on=()=>{s.classList.add('pfs');x.style.display='block'};
x.onclick=off;
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const bf=[...document.querySelectorAll('.ctl button')].find(b=>b.textContent==='⛶');
if(bf)bf.onclick=()=>{
 if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
 if(s.classList.contains('pfs'))return off();
 const f=s.requestFullscreen||s.webkitRequestFullscreen;
 if(!f)return on();
 Promise.resolve(f.call(s)).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(on)};
})();
