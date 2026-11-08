(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const st=document.createElement('style');st.textContent=`
#scbtn{position:absolute;top:10px;left:64px;z-index:5;padding:8px 12px}#trbtn{position:absolute;top:10px;left:116px;z-index:5;padding:8px 12px}
.sr2{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}.sr2>div{flex:1;min-width:0;word-break:break-word}.sr2 small{display:block;color:var(--mute);font-size:12px}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sc{padding:10px;border-radius:16px;background:rgba(255,255,255,.1);text-align:center;font-size:12px;color:var(--mute)}.sc b{display:block;font-size:20px;color:var(--ink)}
.bd{position:relative;padding:10px 8px;border-radius:16px;background:rgba(255,255,255,.12);text-align:center;font-size:12px}.bd i{display:block;font-size:26px;font-style:normal}.bd small{display:block;color:var(--mute);font-size:11px}
.bd.lock{opacity:.35;filter:grayscale(1)}.bd .nw{position:absolute;top:4px;right:6px;font-size:10px;color:#ffd166}
.lbr{display:flex;justify-content:space-between;padding:4px 2px;font-size:14px}.lbr.me{color:var(--acc);font-weight:700}`;
document.head.appendChild(st);
const join=$('join'),H=j=>Object.assign(j?{'Content-Type':'application/json'}:{},{Authorization:'Bearer '+TOKEN});
const modal=build=>{const o=mk('div',0,'ov'),g=mk('div',0,'glass sp');o.appendChild(g);const close=()=>o.remove();build(g,close);o.onclick=e=>{if(e.target===o)close()};document.body.appendChild(o)};
const sb=mk('button','📅');sb.id='scbtn';const tb=mk('button','🏆');tb.id='trbtn';join.append(sb,tb);
const dur=m=>{const h=Math.floor(m/60);return h?h+' j '+(m%60)+' m':m+' m'};
const rel=ts=>{const d=ts-Date.now();if(d<=0)return'sedang berlangsung';const m=Math.round(d/60000);if(m<60)return m+' menit lagi';if(m<1440)return Math.round(m/60)+' jam lagi';return Math.round(m/1440)+' hari lagi'};
/* ---------- jadwal ---------- */
sb.onclick=()=>modal((g,close)=>{
 g.append(mk('b','📅 Jadwal nobar'));const cl=mk('button','Tutup');cl.onclick=close;
 if(!USER){g.append(mk('p','Login dulu untuk membuat jadwal.','badge'),cl);return}
 const ti=mk('input'),rm=mk('input'),dt=mk('input'),iv=mk('input'),cr=mk('button','Buat jadwal','pri'),msg=mk('p','','badge'),list=mk('div'),say=t=>{msg.textContent=t};
 ti.placeholder='Judul (mis. Nobar Jumat)';ti.maxLength=40;
 rm.placeholder='Kode room';rm.maxLength=12;rm.autocapitalize='characters';rm.value=$('code').value;
 const loc=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 dt.type='datetime-local';dt.value=loc(new Date(Date.now()+3600e3));dt.min=loc(new Date());
 iv.placeholder='Undang username (pisahkan koma)';iv.autocapitalize='none';
 [ti,rm,dt,iv].forEach(i=>i.autocomplete='off');
 async function refresh(){list.innerHTML='';
  try{const r=await fetch('/api/sched',{headers:H()}),j=await r.json();
   if(!j.items||!j.items.length){list.append(mk('p','Belum ada jadwal.','badge'));return}
   j.items.forEach(s=>{const row=mk('div',0,'sr2'),info=mk('div');
    const when=new Date(s.ts).toLocaleString('id-ID',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    info.append(mk('b',s.title),mk('small',when+' · '+rel(s.ts)+' · room '+s.room+(s.mine?'':' · oleh '+s.owner)));row.appendChild(info);
    const go=mk('button','Masuk','pri');go.onclick=()=>{close();$('code').value=s.room;$('go').click()};row.appendChild(go);
    if(s.mine){const x=mk('button','✕');x.onclick=async()=>{await fetch('/api/sched?id='+s.id,{method:'DELETE',headers:H()});refresh()};row.appendChild(x)}
    list.appendChild(row)})}catch(e){list.append(mk('p','Gagal memuat jadwal.','badge'))}}
 cr.onclick=async()=>{const at=new Date(dt.value).getTime();if(!rm.value.trim())return say('Isi kode room');if(!at)return say('Pilih tanggal dan jam');
  cr.disabled=true;say('Membuat jadwal…');
  try{const r=await fetch('/api/sched',{method:'POST',headers:H(1),body:JSON.stringify({title:ti.value,room:rm.value,at,invitees:iv.value.split(',')})}),j=await r.json();
   if(!r.ok)say('⚠️ '+(j.error||'Gagal'));
   else{say('✅ Jadwal dibuat.'+(j.unknown&&j.unknown.length?' Username tidak ditemukan: '+j.unknown.join(', '):'')+' Teman yang diundang menerima notifikasi push.');ti.value=iv.value='';refresh()}}
  catch(e){say('⚠️ Tidak bisa terhubung ke server')}cr.disabled=false};
 g.append(ti,rm,dt,iv,cr,msg,mk('h4','Jadwal mendatang'),list,mk('p','Pengingat dikirim lewat push 15 menit sebelum dan tepat saat mulai. Kalau room diberi password, beri tahu temanmu secara terpisah.','badge'),cl);
 refresh()});
/* ---------- lencana & statistik ---------- */
tb.onclick=()=>modal((g,close)=>{
 g.append(mk('b','🏆 Statistik & lencana'));const cl=mk('button','Tutup');cl.onclick=close;
 if(!USER){g.append(mk('p','Login dulu untuk melihat statistikmu.','badge'),cl);return}
 const box=mk('div');box.style.cssText='display:grid;gap:10px';box.append(mk('p','Memuat…','badge'));g.append(box,cl);
 Promise.all([fetch('/api/mystats',{headers:H()}).then(r=>r.json()),fetch('/api/leaderboard',{headers:H()}).then(r=>r.json())]).then(([s,lb])=>{
  box.innerHTML='';
  const card=(v,l)=>{const c=mk('div',0,'sc');c.append(mk('b',v),document.createTextNode(l));return c};
  const grid=mk('div',0,'sg');
  grid.append(card(dur(s.minutes),'Waktu nonton'),card(s.messages,'Pesan'),card(s.created+' / '+s.joined,'Room dibuat / dimasuki'),card('🔥 '+s.streak+' hari','Streak (terbaik '+s.longest+')'));
  box.appendChild(grid);
  if(s.rank)box.appendChild(mk('p','Peringkatmu: #'+s.rank+' penonton paling rajin','badge'));
  const seen=(LS.g('nb-badges')||'').split(',');
  box.appendChild(mk('h4','Lencana ('+s.badges.filter(b=>b.got).length+'/'+s.badges.length+')'));
  const bg=mk('div',0,'sg');
  s.badges.forEach(b=>{const t=mk('div',0,'bd'+(b.got?'':' lock'));t.append(mk('i',b.icon),mk('b',b.name),mk('small',b.desc));
   if(b.got&&LS.g('nb-badges')!==null&&!seen.includes(b.id))t.appendChild(mk('span','✨ baru','nw'));bg.appendChild(t)});
  box.appendChild(bg);LS.s('nb-badges',s.badges.filter(b=>b.got).map(b=>b.id).join(','));
  box.appendChild(mk('h4','Penonton paling rajin'));
  if(!lb.top||!lb.top.length)box.appendChild(mk('p','Belum ada data.','badge'));
  else lb.top.forEach((x,i)=>{const r=mk('div',0,'lbr'+(x.username.toLowerCase()===USER.toLowerCase()?' me':''));r.append(mk('span',(i+1)+'. '+x.username),mk('span',dur(x.minutes)));box.appendChild(r)});
  box.appendChild(mk('p','Waktu nonton dihitung hanya saat video sedang diputar dan kamu ada di room. Statistik mulai dihitung sejak fitur ini aktif.','badge'));
 }).catch(()=>{box.innerHTML='';box.append(mk('p','Gagal memuat statistik.','badge'))})});
})();
