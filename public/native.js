(()=>{
const C=window.Capacitor;
if(!(C&&C.isNativePlatform&&C.isNativePlatform()))return;
window.NB_APP=true;
const $=id=>document.getElementById(id);
const call=(m,a)=>{try{
 if(C.nativePromise)C.nativePromise('NobarNative',m,a||{}).catch(()=>{});
 else if(C.Plugins&&C.Plugins.NobarNative&&C.Plugins.NobarNative[m])C.Plugins.NobarNative[m](a||{}).catch(()=>{})}catch(e){}};
const st=document.createElement('style');
st.textContent='#apkbtn{display:none!important}#nx{display:none;position:fixed;top:calc(env(safe-area-inset-top,0px) + 10px);right:12px;z-index:40;padding:8px 14px;background:rgba(20,26,48,.85)}';
document.head.appendChild(st);
const stage=$('stage'),nx=document.createElement('button');nx.id='nx';nx.textContent='✕ Tutup';document.body.appendChild(nx);
function setFS(on){stage.classList.toggle('pfs',on);nx.style.display=on?'block':'none';call('fullscreen',{on});call('landscape',{on})}
nx.onclick=()=>setFS(false);
const bf=[...document.querySelectorAll('.ctl button')].find(b=>b.textContent==='⛶');
if(bf)bf.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();setFS(!stage.classList.contains('pfs'))},true);
let awake=null;
setInterval(()=>{const r=$('room').style.display==='flex';if(r!==awake){awake=r;call('keepAwake',{on:r})}},1500);
window.nbBack=()=>{
 if(stage.classList.contains('pfs')){setFS(false);return true}
 const ov=document.querySelectorAll('.ov');if(ov.length){ov[ov.length-1].remove();return true}
 for(const id of ['ppl','qs']){const e=$(id);if(e&&e.classList.contains('on')){e.classList.remove('on');return true}}
 if($('room').style.display==='flex'){toast('Ketuk tombol Keluar untuk meninggalkan room');return true}
 return false};
})();
