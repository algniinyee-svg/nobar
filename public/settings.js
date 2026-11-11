(()=>{
const $=id=>document.getElementById(id);
const {mk,seg,toggle,row,group,sec}=window.NB;
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
function modal(title,build){
 const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');o.appendChild(g);g.appendChild(mk('b',title));
 build(g,()=>o.remove());o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
const swatches=()=>{const nt=window.nbTheme;return Object.keys(nt.TH).map(k=>({v:k,l:nt.TH[k].n,dot:'linear-gradient(135deg,'+nt.TH[k].g[0]+','+nt.TH[k].g[2]+')'}))};
/* ---------- 🎨 tema di halaman utama ---------- */
const tb=$('thbtn');
if(tb)tb.onclick=()=>modal('Tema warna',g=>{const nt=window.nbTheme;g.appendChild(seg(swatches(),nt.get(),k=>nt.set(k),{sw:true}))});
/* ---------- ⚙️ setelan di dalam room ---------- */
function openSettings(){modal('Setelan',g=>{
 const M=window.nbMore,nt=window.nbTheme,P=window.nbPush,pw=M.pw();
 const st=mk('p','','badge');st.id='nbst';const say=t=>{st.textContent=t};
 /* Room */
 const cc=mk('button','Salin');cc.onclick=()=>M.copy(code,'Kode disalin',cc);
 let r2;
 if(pw){
  const eye=mk('button','Lihat'),cp=mk('button','Salin'),w=mk('div');w.style.cssText='display:flex;gap:6px';w.append(eye,cp);
  r2=row('Password','••••••',w);let sh=false;
  eye.onclick=()=>{sh=!sh;r2.sub.textContent=sh?pw:'••••••';eye.textContent=sh?'Sembunyi':'Lihat'};
  cp.onclick=()=>M.copy(pw,'Password disalin',cp)
 }else r2=row('Password','Tanpa password');
 const inv=mk('button','Salin undangan','pri');inv.style.width='100%';
 inv.onclick=()=>M.copy('Gabung Nobar!\n'+location.origin+'/#'+code+'\nKode room: '+code+(pw?'\nPassword: '+pw:''),'Undangan disalin',inv);
 g.append(sec('Room'),group(row('Kode room',code,cc),r2),inv);
 /* Tampilan */
 const sTheme=seg(swatches(),nt.get(),k=>nt.set(k),{sw:true});
 const sPerf=seg([{v:'auto',l:'Otomatis'},{v:'lite',l:'Ringan'},{v:'full',l:'Penuh'}],LS.g('nb-perf')||'auto',k=>{LS.s('nb-perf',k);if(k==='auto')LS.s('nb-slow','0')});
 g.append(sec('Tampilan'),group(row('Tema',null,sTheme,true),row('Performa','Ringan mematikan animasi dan blur untuk HP berat',sPerf,true)));
 /* Suara & video */
 const sQ=seg([{v:'low',l:'Hemat'},{v:'std',l:'Standar'},{v:'high',l:'Tinggi'}],M.cfg.q,k=>M.setQ(k));
 g.append(sec('Suara & video'),group(row('Kualitas','Hemat cocok untuk jaringan lemah',sQ,true)));
 /* Notifikasi */
 const tN=toggle(M.cfg.n,async on=>{const ok=await M.setN(on);if(on&&!ok)tN.set(false)});
 const tV=toggle(M.cfg.v,on=>M.setV(on));
 const can=!!USER&&!!P&&P.supported();
 const tP=toggle(can&&P.isOn(),async on=>{
  try{if(on)await P.on();else await P.off();say(on?'✅ Aktif. Ketuk "Tes notifikasi" untuk mencoba.':'Dimatikan untuk akun ini di perangkat ini.')}
  catch(e){tP.set(!on);say('⚠️ '+(typeof e==='string'?e:'Gagal'))}});
 if(!can)tP.disable(true);
 const tt=mk('button','Tes');
 tt.onclick=async()=>{if(!TOKEN)return say('Login dulu');tt.disabled=true;say('Mengirim tes…');
  try{const r=await fetch('/api/push/test',{method:'POST',headers:{Authorization:'Bearer '+TOKEN}}),j=await r.json();
   if(!r.ok)say('⚠️ '+(j.error||'Gagal'));
   else if(!j.devices)say('⚠️ Belum ada perangkat terdaftar untuk akunmu. Nyalakan push dulu.');
   else if(j.ok)say('✅ Terkirim ke '+j.ok+' dari '+j.devices+' perangkat'+(j.errors.length?' (gagal: '+j.errors.join(', ')+')':'')+'.');
   else say('⚠️ Gagal terkirim ke '+j.devices+' perangkat (kode: '+j.errors.join(', ')+'). Nyalakan ulang push.')}
  catch(e){say('⚠️ Tidak bisa terhubung ke server')}tt.disabled=false};
 const iu=mk('input');iu.placeholder='Username teman';iu.maxLength=16;iu.autocapitalize='none';iu.autocomplete='off';iu.style.cssText='flex:1;min-width:0';
 const ib=mk('button','Undang','pri');
 ib.onclick=()=>{const u=iu.value.trim();if(!u)return say('Isi username teman');try{ws.send(JSON.stringify({t:'invite',to:u}));say('Mengirim undangan…')}catch(e){say('Tidak terhubung ke server')}iu.value=''};
 const ir=mk('div');ir.style.cssText='display:flex;gap:8px;padding:11px 0';ir.append(iu,ib);
 g.append(sec('Notifikasi'),group(
  row('Saat aplikasi di latar','Pesan dan aktivitas room',tN),
  row('Getar',null,tV),
  row(window.NB_APP?'Notifikasi aplikasi':'Push saat ditutup',can?'Undangan masuk walau Nobar ditutup':'Login dulu untuk memakai push',tP),
  row('Tes notifikasi',null,tt),ir),st);
})}
const gp=document.querySelector('.grp'),sb=mk('button','⚙️');sb.style.padding='6px 10px';sb.onclick=openSettings;
if(gp)gp.insertBefore(sb,$('share'));
})();
