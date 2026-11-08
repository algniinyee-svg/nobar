(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const st=document.createElement('style');st.textContent=`
#avbtn{position:absolute;top:10px;right:116px;z-index:5;padding:8px 12px}
#hpbtn{position:absolute;top:10px;left:12px;z-index:5;padding:8px 12px}
.avv{width:120px;height:120px;margin:0 auto;border-radius:50%;background:rgba(255,255,255,.14) center/cover no-repeat;border:2px solid rgba(255,255,255,.35);display:grid;place-items:center;font-size:40px}`;
document.head.appendChild(st);
const join=$('join'),hdr=()=>({Authorization:'Bearer '+TOKEN});
const modal=build=>{const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');o.appendChild(g);const close=()=>o.remove();build(g,close);o.onclick=e=>{if(e.target===o)close()};document.body.appendChild(o)};
/* ---------- push di halaman utama ---------- */
const pb=mk('button','🔔');pb.id='hpbtn';join.appendChild(pb);
pb.onclick=()=>modal((g,close)=>{
 const P=window.nbPush,sp=mk('p','','badge'),say=t=>{sp.textContent=t};
 g.append(mk('b','Notifikasi push'));
 const tg=mk('button'),tt=mk('button','🧪 Tes notifikasi'),cl=mk('button','Tutup');
 const ok=!!(P&&P.supported());
 if(!ok)g.append(mk('p','Browser ini tidak mendukung push.','badge'));
 else if(!USER)g.append(mk('p','Login dulu untuk mengaktifkan push.','badge'));
 tg.disabled=tt.disabled=!ok||!USER;
 const lab=()=>{tg.textContent=ok&&P.isOn()?'🔔 Push: Aktif (ketuk untuk matikan)':'🔕 Push: Mati (ketuk untuk aktifkan)'};lab();
 let busy=false;
 tg.onclick=async()=>{if(busy)return;busy=true;tg.disabled=true;say('Memproses…');
  try{if(P.isOn()){await P.off();say('Push dimatikan di perangkat ini.')}else{await P.on();say('✅ Push aktif. Ketuk "Tes notifikasi".')}}
  catch(e){say('⚠️ '+(typeof e==='string'?e:'Gagal'))}
  busy=false;tg.disabled=false;lab()};
 tt.onclick=async()=>{tt.disabled=true;say('Mengirim tes…');
  try{const r=await fetch('/api/push/test',{method:'POST',headers:Object.assign({'Content-Type':'application/json'},hdr())}),j=await r.json();
   if(!r.ok)say('⚠️ '+(j.error||'Gagal'));else if(!j.devices)say('⚠️ Belum ada perangkat terdaftar. Nyalakan push dulu.');
   else if(j.ok)say('✅ Terkirim ke '+j.ok+' dari '+j.devices+' perangkat. Notifikasi seharusnya muncul.');else say('⚠️ Gagal terkirim (kode: '+j.errors.join(', ')+')')}
  catch(e){say('⚠️ Tidak bisa terhubung ke server')}tt.disabled=!ok||!USER};
 cl.onclick=close;g.append(tg,tt,sp,mk('p','Push dicatat per akun dan per perangkat. Undangan masuk walau Nobar ditutup.','badge'),cl)});
/* ---------- avatar ---------- */
const ab=mk('button','👤');ab.id='avbtn';join.appendChild(ab);
async function toAvatar(file){let bmp;
 try{bmp=await (window.createImageBitmap?createImageBitmap(file):new Promise((ok,rj)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=rj;i.src=URL.createObjectURL(file)}))}catch(e){throw'Format foto tidak didukung'}
 const s=Math.min(bmp.width,bmp.height),c=document.createElement('canvas');c.width=c.height=192;
 c.getContext('2d').drawImage(bmp,(bmp.width-s)/2,(bmp.height-s)/2,s,s,0,0,192,192);
 return await new Promise(ok=>c.toBlob(ok,'image/jpeg',.82))}
ab.onclick=()=>modal((g,close)=>{
 const pv=mk('div','👤','avv'),msg=mk('p','','badge'),say=t=>{msg.textContent=t};
 const f=document.createElement('input');f.type='file';f.accept='image/*';f.style.display='none';
 const pick=mk('button','Pilih foto','pri'),del=mk('button','Hapus foto'),cl=mk('button','Tutup');
 g.append(mk('b','Foto profil'));
 if(!USER)g.append(mk('p','Login dulu untuk memasang foto profil.','badge'));
 pick.disabled=del.disabled=!USER;
 if(USER)fetch('/api/avatar',{headers:hdr()}).then(async r=>{if(r.ok){pv.style.backgroundImage='url("'+URL.createObjectURL(await r.blob())+'")';pv.textContent=''}}).catch(()=>{});
 pick.onclick=()=>f.click();
 f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;pick.disabled=true;say('Memproses foto…');
  try{if(!/^image\//.test(file.type))throw'File bukan gambar';const blob=await toAvatar(file);say('Mengunggah…');
   const r=await fetch('/api/avatar',{method:'POST',headers:Object.assign({'Content-Type':'image/jpeg'},hdr()),body:blob});
   if(!r.ok){let j={};try{j=await r.json()}catch(e){}throw j.error||'Gagal mengunggah'}
   pv.style.backgroundImage='url("'+URL.createObjectURL(blob)+'")';pv.textContent='';say('✅ Foto profil tersimpan di akunmu.')}
  catch(e){say('⚠️ '+(typeof e==='string'?e:'Foto tidak bisa diproses'))}
  pick.disabled=!USER;f.value=''};
 del.onclick=async()=>{del.disabled=true;say('Menghapus…');
  try{const r=await fetch('/api/avatar',{method:'DELETE',headers:hdr()});if(!r.ok)throw 1;pv.style.backgroundImage='';pv.textContent='👤';say('Foto dihapus.')}catch(e){say('⚠️ Gagal menghapus')}
  del.disabled=!USER};
 cl.onclick=close;g.append(pv,f,pick,del,msg,mk('p','Foto tampil di kursi bioskop dalam room. Hanya sesama pengguna yang login yang bisa melihatnya.','badge'),cl)});
})();
