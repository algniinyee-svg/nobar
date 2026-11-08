(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const st=document.createElement('style');st.textContent=`
#wp{position:fixed;inset:0;z-index:-1;display:none;background-size:cover;background-position:center}
#wp::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(11,16,32,.3),rgba(11,16,32,.62))}
#wpbtn{position:absolute;top:10px;right:64px;z-index:5;padding:8px 12px}
.wpv{width:100%;aspect-ratio:9/11;border-radius:18px;background:rgba(255,255,255,.1) center/cover no-repeat;border:1px solid rgba(255,255,255,.2)}`;
document.head.appendChild(st);
const wp=mk('div');wp.id='wp';document.querySelector('.bg').after(wp);
const join=$('join');let has=false,url='',lastUser='\u0000';
const show=()=>{wp.style.display=has&&join.style.display!=='none'?'block':'none'};
new MutationObserver(show).observe(join,{attributes:true,attributeFilter:['style']});
function setImg(u){if(url)URL.revokeObjectURL(url);url=u;has=!!u;wp.style.backgroundImage=u?'url("'+u+'")':'';show()}
const auth=()=>({Authorization:'Bearer '+TOKEN});
async function fetchWp(){try{const r=await fetch('/api/wallpaper',{headers:auth()});if(!r.ok){setImg('');return}setImg(URL.createObjectURL(await r.blob()))}catch(e){}}
setInterval(()=>{if(USER!==lastUser){lastUser=USER;if(USER)fetchWp();else setImg('')}},1500);
async function toJpeg(file){
 let bmp;try{bmp=await (window.createImageBitmap?createImageBitmap(file):new Promise((ok,rj)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=rj;i.src=URL.createObjectURL(file)}))}catch(e){throw'Format foto tidak didukung. Pakai JPEG atau PNG'}
 const k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),w=Math.round(bmp.width*k),h=Math.round(bmp.height*k);
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(bmp,0,0,w,h);
 for(const q of [.78,.65,.5,.38]){const b=await new Promise(ok=>c.toBlob(ok,'image/jpeg',q));if(b&&b.size<780000)return b}
 throw'Foto terlalu besar'}
function open(){const o=mk('div',0,'ov'),g=mk('div',0,'glass sp'),msg=mk('p','','badge'),say=t=>{msg.textContent=t};
 g.append(mk('b','Wallpaper halaman utama'));
 if(!USER)g.append(mk('p','Login dulu untuk memakai wallpaper sendiri. Foto disimpan di akunmu.','badge'));
 const pv=mk('div',0,'wpv');if(has)pv.style.backgroundImage='url("'+url+'")';
 const f=document.createElement('input');f.type='file';f.accept='image/*';f.style.display='none';
 const pick=mk('button','Pilih foto','pri'),del=mk('button','Hapus wallpaper'),cl=mk('button','Tutup');
 pick.disabled=del.disabled=!USER;pick.onclick=()=>f.click();
 f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;pick.disabled=true;say('Memproses foto…');
  try{if(!/^image\//.test(file.type))throw'File bukan gambar';const blob=await toJpeg(file);say('Mengunggah…');
   const r=await fetch('/api/wallpaper',{method:'POST',headers:Object.assign({'Content-Type':'image/jpeg'},auth()),body:blob});
   if(!r.ok){let j={};try{j=await r.json()}catch(e){}throw j.error||'Gagal mengunggah'}
   setImg(URL.createObjectURL(blob));pv.style.backgroundImage='url("'+url+'")';say('✅ Wallpaper tersimpan di akunmu.')}
  catch(e){say('⚠️ '+(typeof e==='string'?e:'Foto tidak bisa diproses'))}
  pick.disabled=!USER;f.value=''};
 del.onclick=async()=>{del.disabled=true;say('Menghapus…');
  try{const r=await fetch('/api/wallpaper',{method:'DELETE',headers:auth()});if(!r.ok)throw 1;setImg('');pv.style.backgroundImage='';say('Wallpaper dihapus.')}catch(e){say('⚠️ Gagal menghapus')}
  del.disabled=!USER};
 cl.onclick=()=>o.remove();g.append(pv,f,pick,del,msg,mk('p','Wallpaper hanya tampil di halaman utama. Di dalam room tetap memakai tema warna.','badge'),cl);
 o.appendChild(g);o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
const b=mk('button','🖼️');b.id='wpbtn';b.onclick=open;join.appendChild(b);
})();
