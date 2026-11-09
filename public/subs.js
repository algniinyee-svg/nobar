(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const st=document.createElement('style');st.textContent=`
#stage>#sub{position:absolute!important;inset:auto 5% 9% 5%!important;width:auto!important;height:auto!important;text-align:center;z-index:8;pointer-events:none;display:none}
#sub span{display:inline-block;padding:3px 10px;border-radius:10px;background:rgba(0,0,0,.55);color:#fff;line-height:1.35;text-shadow:0 1px 3px #000;white-space:pre-line}
.sbr{display:flex;gap:6px}.sbr button{flex:1;padding:9px 4px;font-size:13px}`;
document.head.appendChild(st);
const sub=mk('div');sub.id='sub';sub.setAttribute('data-keep','1');$('stage').appendChild(sub);
const S={cues:[],tr:LS.g('nb-subtr')==='1',off:0,size:+LS.g('nb-subsz')||16,job:0,vk:''};
sub.style.fontSize=S.size+'px';
const key=()=>JSON.stringify(vid||'');
/* ---------- parser .srt / .vtt ---------- */
function parse(txt){txt=txt.replace(/\r/g,'').replace(/^\uFEFF/,'');
 const tm=/(\d{1,2}:)?(\d{1,2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}:)?(\d{1,2}):(\d{2})[,.](\d{1,3})/;
 const ts=(h,m,s,ms)=>(h?parseInt(h):0)*3600+parseInt(m)*60+parseInt(s)+parseInt(ms.padEnd(3,'0'))/1000;
 const out=[];
 txt.split(/\n{2,}/).forEach(b=>{const L=b.split('\n'),i=L.findIndex(l=>tm.test(l));if(i<0)return;const m=L[i].match(tm);
  const t=L.slice(i+1).join('\n').replace(/<[^>]+>/g,'').replace(/\{[^}]*\}/g,'').trim();
  if(t)out.push({a:ts(m[1],m[2],m[3],m[4]),b:ts(m[5],m[6],m[7],m[8]),t})});
 return out.sort((x,y)=>x.a-y.a)}
/* ---------- tampilan teks ---------- */
setInterval(()=>{if(!S.cues.length){sub.style.display='none';return}
 const t=cur()+S.off;let lo=0,hi=S.cues.length-1,k=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(S.cues[mid].a<=t){k=mid;lo=mid+1}else hi=mid-1}
 let c=null;for(let j=k;j>=0&&j>k-4;j--){const q=S.cues[j];if(t>=q.a&&t<=q.b){c=q;break}}
 if(!c){sub.style.display='none';return}
 const txt=(S.tr&&c.t2)?c.t2:c.t;
 if(sub._t!==txt){sub._t=txt;sub.textContent='';sub.appendChild(mk('span',txt))}
 sub.style.display='block'},150);
/* ---------- reset kalau video berganti ---------- */
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);
 if(m.t==='state'&&m.video){const k=JSON.stringify(m.video);if(S.vk&&S.vk!==k&&S.cues.length){S.cues=[];S.job++;sub._t='';toast('Subtitle direset karena video berganti')}if(!S.cues.length)S.vk=k}}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
/* ---------- terjemahan ke Indonesia ---------- */
async function translateAll(say){
 if(!TOKEN)return say('Login dulu untuk menerjemahkan.');
 const cues=S.cues.slice(0,2500),id=++S.job;
 for(let i=0;i<cues.length&&id===S.job;){
  const batch=[];let chars=0;
  while(i+batch.length<cues.length&&batch.length<40){const t=cues[i+batch.length].t.replace(/\s*\n\s*/g,' ');if(chars+t.length>3000&&batch.length)break;batch.push(t);chars+=t.length}
  try{const r=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+TOKEN},body:JSON.stringify({lines:batch})});
   const j=await r.json();if(!r.ok)throw j.error||'gagal';
   j.lines.forEach((t,k)=>{if(cues[i+k])cues[i+k].t2=t})}
  catch(e){say('⚠️ Terjemahan terhenti: '+(typeof e==='string'?e:'gagal')+'. Sisanya tampil bahasa asli.');return}
  i+=batch.length;say('Menerjemahkan… '+Math.min(i,cues.length)+'/'+cues.length)}
 if(id===S.job)say('✅ Terjemahan selesai ('+cues.length+' baris).')}
/* ---------- CC bawaan YouTube ---------- */
async function ytCC(mode,say){
 if(!yt||!yt.setOption)return say('Pilihan ini hanya untuk video YouTube.');
 try{
  if(mode==='off'){yt.setOption('captions','track',{});try{yt.unloadModule('captions')}catch(e){}return say('CC dimatikan.')}
  yt.loadModule('captions');await wait(900);
  let list=[];try{list=yt.getOption('captions','tracklist')||[]}catch(e){}
  if(!list.length){await wait(1200);try{list=yt.getOption('captions','tracklist')||[]}catch(e){}}
  if(!list.length)return say('Video ini tidak punya subtitle yang bisa dipakai.');
  const en=list.find(t=>/^en/i.test(t.languageCode)&&t.kind!=='asr')||list.find(t=>/^en/i.test(t.languageCode))||list[0];
  if(mode==='id'){
   const idt=list.find(t=>/^id/i.test(t.languageCode));
   if(idt){yt.setOption('captions','track',{languageCode:idt.languageCode});return say('CC Indonesia aktif.')}
   yt.setOption('captions','track',{languageCode:en.languageCode,translationLanguage:{languageCode:'id',languageName:'Indonesia'}});
   await wait(900);let c2=null;try{c2=yt.getOption('captions','track')}catch(e){}
   return say(c2&&c2.translationLanguage?'CC diterjemahkan ke Indonesia (otomatis YouTube).':'Belum bisa dipastikan aktif. Kalau teks masih bahasa asli, pakai unggah file subtitle di bawah.')}
  yt.setOption('captions','track',{languageCode:en.languageCode});say('CC bahasa asli aktif ('+(en.languageName||en.languageCode)+').')
 }catch(e){say('Gagal mengatur CC.')}}
/* ---------- panel ---------- */
function openPanel(){const o=mk('div',0,'ov'),g=mk('div',0,'glass sp'),msg=mk('p','','badge'),say=t=>{msg.textContent=t};o.appendChild(g);
 g.append(mk('b','Subtitle'),mk('h4','YouTube (CC bawaan)'));
 const r1=mk('div',0,'sbr');[['Mati','off'],['Indonesia','id'],['Asli','orig']].forEach(([l,m])=>{const b=mk('button',l);b.onclick=()=>ytCC(m,say);r1.appendChild(b)});
 g.append(r1,mk('h4','File subtitle (.srt / .vtt)'));
 const f=document.createElement('input');f.type='file';f.accept='.srt,.vtt,text/plain';f.style.display='none';
 const pick=mk('button','Pilih file subtitle','pri'),tr=mk('button'),clr=mk('button','Hapus subtitle');
 const lab=()=>{tr.textContent=S.tr?'🌐 Terjemahkan ke Indonesia: Aktif':'🌐 Terjemahkan ke Indonesia: Mati'};lab();
 pick.onclick=()=>f.click();
 f.onchange=async()=>{const file=f.files&&f.files[0];if(!file)return;
  try{const cues=parse(await file.text());if(!cues.length)throw'Format tidak dikenali. Gunakan .srt atau .vtt.';
   S.cues=cues;S.vk=key();S.off=0;sub._t='';say('✅ '+cues.length+' baris dimuat.');if(S.tr)translateAll(say)}
  catch(e){say('⚠️ '+(typeof e==='string'?e:'File tidak bisa dibaca'))}f.value=''};
 tr.onclick=()=>{S.tr=!S.tr;LS.s('nb-subtr',S.tr?'1':'0');lab();if(S.tr&&S.cues.length)translateAll(say)};
 clr.onclick=()=>{S.cues=[];S.job++;sub._t='';say('Subtitle dihapus.')};
 const r2=mk('div',0,'sbr'),ov=mk('span','','badge');ov.style.cssText='align-self:center;white-space:nowrap';
 const upd=()=>{ov.textContent='Geser: '+(S.off>=0?'+':'')+S.off.toFixed(1)+' dtk'};upd();
 const adj=(l,fn)=>{const b=mk('button',l);b.onclick=fn;r2.appendChild(b)};
 adj('−0.5',()=>{S.off-=.5;upd()});adj('+0.5',()=>{S.off+=.5;upd()});r2.appendChild(ov);
 adj('A−',()=>{S.size=Math.max(11,S.size-2);sub.style.fontSize=S.size+'px';LS.s('nb-subsz',S.size)});
 adj('A+',()=>{S.size=Math.min(30,S.size+2);sub.style.fontSize=S.size+'px';LS.s('nb-subsz',S.size)});
 g.append(f,pick,tr,r2,clr,msg,mk('p','Subtitle hanya tampil di HP-mu dan tidak ikut dikirim ke teman. Kalau teks terlambat atau terlalu cepat, geser dengan tombol −0.5 / +0.5.','badge'));
 o.onclick=e=>{if(e.target===o)o.remove()};document.body.appendChild(o)}
const bt=mk('button','CC Subtitle');bt.onclick=openPanel;
(window.nbTools||document.querySelector('.ctl')).append?window.nbTools.appendChild(bt):null;
})();
