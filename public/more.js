(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const Q={low:{w:160,h:120,f:10,vb:90000,ab:24000,l:'Hemat'},std:{w:240,h:180,f:15,vb:200000,ab:32000,l:'Standar'},high:{w:480,h:360,f:24,vb:500000,ab:48000,l:'Tinggi'}};
const cfg={q:Q[LS.g('nb-q')]?LS.g('nb-q'):'std',n:LS.g('nb-n')==='1',v:LS.g('nb-v')!=='0'};
let roomPw=null,lastIds=null;
const st=document.createElement('style');st.textContent=`
.code{font:700 22px/1.2 ui-monospace,monospace;letter-spacing:2px;text-align:center;padding:14px;border-radius:18px;background:rgba(8,12,28,.35);box-shadow:inset 0 2px 7px rgba(0,0,0,.4);user-select:all}`;
document.head.appendChild(st);
const copy=(t,m,btn)=>{const ok=()=>{toast(m);if(btn){const o=btn.textContent;btn.textContent='✓ Tersalin';setTimeout(()=>btn.textContent=o,1500)}};
 const fb=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,t.length);const r=document.execCommand('copy');a.remove();if(r)ok();else toast('Gagal menyalin. Tahan teks kode lalu pilih Salin')}catch(e){toast('Gagal menyalin. Tahan teks kode lalu pilih Salin')}};
 if(navigator.clipboard&&navigator.clipboard.writeText){let d=false;const tm=setTimeout(()=>{if(!d){d=true;fb()}},800);navigator.clipboard.writeText(t).then(()=>{if(!d){d=true;clearTimeout(tm);ok()}},()=>{if(!d){d=true;clearTimeout(tm);fb()}})}else fb()};
function modal(build){const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');o.appendChild(g);const close=()=>o.remove();build(g,close);o.onclick=e=>{if(e.target===o)close()};document.body.appendChild(o)}
function showCode(code,title){modal((g,close)=>{
 g.append(mk('b',title),mk('p','Simpan kode ini baik-baik. Hanya tampil sekali dan dipakai untuk reset password kalau kamu lupa.','badge'),mk('div',code,'code'));
 const cp=mk('button','Salin');cp.onclick=()=>copy(code,'Kode disalin',cp);
 const ok=mk('button','Sudah saya simpan','pri');ok.onclick=close;g.append(cp,ok)})}
/* ---------- akun: lupa password ---------- */
const F=window.fetch;
window.fetch=function(u){const p=F.apply(this,arguments);
 try{if(String(u).indexOf('/api/register')>-1)p.then(r=>r.clone().json().then(j=>{if(j&&j.recovery)setTimeout(()=>showCode(j.recovery,'Akun dibuat! Kode pemulihan kamu'),300)}).catch(()=>{})).catch(()=>{})}catch(e){}
 return p};
const ac=$('acard'),jc=$('jcard');
const fg=mk('button','Lupa password?','lnk');ac.appendChild(fg);
const rc=mk('div',0,'glass card');rc.style.display='none';
const ru=mk('input'),rk=mk('input'),rp=mk('input'),rb=mk('button','Reset password','pri'),rx=mk('button','Kembali','lnk');
ru.placeholder='Username';ru.maxLength=16;ru.autocapitalize='none';ru.autocomplete='username';
rk.placeholder='Kode pemulihan (XXXX-XXXX-XXXX)';rk.maxLength=20;rk.autocapitalize='characters';rk.autocomplete='off';
rp.type='password';rp.placeholder='Password baru (min 6)';rp.maxLength=64;rp.autocomplete='new-password';
rc.append(ru,rk,rp,rb,rx);ac.after(rc);
fg.onclick=()=>{ac.style.display='none';rc.style.display='grid';ru.value=$('au').value};
rx.onclick=()=>{rc.style.display='none';ac.style.display='grid'};
rb.onclick=async()=>{if(!ru.value.trim()||!rk.value.trim()||!rp.value)return toast('Lengkapi semua kolom');
 rb.disabled=true;
 try{const r=await F.call(window,'/api/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:ru.value.trim(),code:rk.value,password:rp.value})});
  const j=await r.json();if(!r.ok)return toast(j.error||'Gagal');
  TOKEN=j.token;USER=j.user;LS.s('nobar-token',TOKEN);rc.style.display='none';rk.value=rp.value='';show();
  showCode(j.recovery,'Password diganti. Kode pemulihan baru')}
 catch(e){toast('Tidak bisa terhubung ke server')}finally{rb.disabled=false}};
const rg=mk('button','🔑 Buat kode pemulihan','lnk');jc.appendChild(rg);
rg.onclick=async()=>{if(!confirm('Buat kode pemulihan baru? Kode lama tidak berlaku lagi.'))return;
 try{const r=await F.call(window,'/api/recovery',{method:'POST',headers:{Authorization:'Bearer '+TOKEN}});const j=await r.json();if(!r.ok)return toast(j.error||'Gagal');showCode(j.recovery,'Kode pemulihan baru')}
 catch(e){toast('Tidak bisa terhubung ke server')}};
setInterval(()=>{rg.style.display=ACC&&USER?'':'none'},1000);
/* ---------- kualitas suara & video ---------- */
const pcs=new Set(),PC=window.RTCPeerConnection;
if(PC){window.RTCPeerConnection=function(){const p=new PC(...arguments);pcs.add(p);p.addEventListener('connectionstatechange',()=>{if(p.connectionState==='closed')pcs.delete(p)});return p};window.RTCPeerConnection.prototype=PC.prototype}
const md=navigator.mediaDevices,g0=md&&md.getUserMedia;
if(g0)md.getUserMedia=function(c){const q=Q[cfg.q];
 if(c&&c.video&&typeof c.video==='object')c=Object.assign({},c,{video:Object.assign({},c.video,{width:{ideal:q.w},height:{ideal:q.h},frameRate:{ideal:q.f,max:q.f+5}})});
 return g0.call(md,c)};
function applyNow(){const q=Q[cfg.q];
 pcs.forEach(p=>{if(p._relay)return;try{p.getSenders().forEach(s=>{if(!s.track)return;const k=s.track.kind;
  try{const pr=s.getParameters();if(!pr.encodings||!pr.encodings.length)pr.encodings=[{}];pr.encodings[0].maxBitrate=k==='video'?q.vb:q.ab;s.setParameters(pr).catch(()=>{})}catch(e){}
  if(k==='video')s.track.applyConstraints({width:{ideal:q.w},height:{ideal:q.h},frameRate:{ideal:q.f,max:q.f+5}}).catch(()=>{})})}catch(e){}})}
setInterval(()=>{if(pcs.size)applyNow()},6000);
/* ---------- notifikasi lokal ---------- */
function notify(t,b,tag){
 if(!document.hidden||!cfg.n||LS.g('nb-p')==='1'||!('Notification' in window)||Notification.permission!=='granted')return;
 const o={body:b,tag:tag||'nobar',renotify:true,icon:'/icon-192.png',badge:'/icon-192.png'};if(cfg.v)o.vibrate=[120,60,120];
 const fb=()=>{try{new Notification(t,{body:b,tag:o.tag})}catch(e){}};
 if(navigator.serviceWorker)navigator.serviceWorker.ready.then(r=>r.showNotification(t,o)).catch(fb);else fb()}
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{on(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
function on(m){
 if(m.t==='joined'){roomPw=m.pw||'';lastIds=null}
 else if(m.t==='chat'&&m.id!==me)notify('💬 '+m.from,m.text,'chat');
 else if(m.t==='joinreq')notify('Permintaan masuk',m.name+' ingin masuk lagi','jr'+m.id);
 else if(m.t==='proposal'&&m.p&&m.p.by!==me)notify('Usulan dari '+m.p.name,'ingin '+m.p.label,'prop');
 else if(m.t==='members'){const ids=new Set(m.list.map(x=>x.id));
  if(lastIds)m.list.forEach(x=>{if(!lastIds.has(x.id)&&x.id!==me)notify('Nobar','👋 '+x.name+' bergabung','join'+x.id)});lastIds=ids}}
/* ---------- untuk panel setelan ---------- */
async function setN(on){
 if(on){
  if(!('Notification' in window)){toast('Browser tidak mendukung notifikasi');return false}
  if(Notification.permission==='denied'){toast('Izin diblokir. Aktifkan lewat pengaturan situs di browser');return false}
  if(Notification.permission!=='granted'){const p=await Notification.requestPermission();if(p!=='granted')return false}}
 cfg.n=!!on;LS.s('nb-n',on?'1':'0');return !!on}
window.nbMore={cfg,Q,copy,pw:()=>roomPw||'',setQ:k=>{if(Q[k]){cfg.q=k;LS.s('nb-q',k);applyNow()}},setN,setV:b=>{cfg.v=!!b;LS.s('nb-v',b?'1':'0')}};
})();
