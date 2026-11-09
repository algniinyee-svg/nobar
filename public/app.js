const $=id=>document.getElementById(id);
let ws,me=0,host=0,mode='solo',code='',name='',vid=null,playing=false,yt=null,el=null,retry=0,dragging=false,sync=null,leaving=false,lt=0,loadingHist=false;
let TOKEN='',USER='',ACC=false,reg=false;
try{TOKEN=localStorage.getItem('nobar-token')||''}catch(e){}
const toast=t=>{const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.display='none',2800)};
const fmt=s=>{s=Math.max(0,s|0);return(s/60|0)+':'+String(s%60).padStart(2,'0')};
const ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!navigator.standalone)$('ioshint').style.display='block';
const hash=location.hash.slice(1);if(hash)$('code').value=decodeURIComponent(hash).toUpperCase();
try{$('name').value=localStorage.getItem('nobar-name')||''}catch(e){}
function show(){$('acard').style.display=ACC&&!USER?'grid':'none';$('jcard').style.display=!ACC||USER?'grid':'none';
 $('hi').style.display=ACC?'block':'none';$('un').textContent=USER;$('name').style.display=ACC?'none':'block'}
(async()=>{try{const r=await fetch('/api/me',{headers:{Authorization:'Bearer '+TOKEN}});const j=await r.json();ACC=!!j.accounts;USER=j.user||''}catch(e){}show()})();
$('at').onclick=()=>{reg=!reg;$('ab').textContent=reg?'Daftar':'Masuk';$('at').textContent=reg?'Sudah punya akun? Masuk':'Belum punya akun? Daftar';$('ap').autocomplete=reg?'new-password':'current-password'};
$('ab').onclick=async()=>{const u=$('au').value.trim(),p=$('ap').value;if(!u||!p)return toast('Isi username dan password');
 $('ab').disabled=true;
 try{const r=await fetch(reg?'/api/register':'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
  const j=await r.json();if(!r.ok)return toast(j.error||'Gagal');
  TOKEN=j.token;USER=j.user;try{localStorage.setItem('nobar-token',TOKEN)}catch(e){}$('ap').value='';show()}
 catch(e){toast('Tidak bisa terhubung ke server')}finally{$('ab').disabled=false}};
['au','ap'].forEach(i=>$(i).onkeydown=e=>{if(e.key==='Enter')$('ab').click()});
$('lo').onclick=()=>{TOKEN='';USER='';try{localStorage.removeItem('nobar-token')}catch(e){}show()};
$('go').onclick=()=>{name=ACC?USER:$('name').value.trim();code=$('code').value.trim().toUpperCase();
 if(!name||!code)return toast(ACC?'Isi kode room':'Isi nama dan kode room');
 try{if(!ACC)localStorage.setItem('nobar-name',name)}catch(e){}
 location.hash=code;$('join').style.display='none';$('room').style.display='flex';$('rc').textContent=code;connect()};
['name','code'].forEach(i=>$(i).onkeydown=e=>{if(e.key==='Enter')$('go').click()});
$('leave').onclick=()=>{const b=$('leave');
 if(!lt){b.textContent='Yakin?';b.classList.add('pri');lt=setTimeout(()=>{lt=0;b.textContent='Keluar';b.classList.remove('pri')},3000);return}
 clearTimeout(lt);leaving=true;try{ws.close()}catch(e){}location.replace(location.pathname)};
function connect(){
 ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host);
 ws.onopen=()=>{retry=0;ws.send(JSON.stringify({t:'join',room:code,name,token:TOKEN}))};
 ws.onclose=()=>{if(leaving)return;toast('Terputus, menyambung ulang…');setTimeout(connect,Math.min(1000*++retry,5000))};
 ws.onmessage=e=>{const m=JSON.parse(e.data);
  if(m.t==='joined'){me=m.id}
  else if(m.t==='members'){const prevHost=host;host=m.host;mode=m.mode;
   $('info').textContent=m.list.length+' orang · '+(mode==='duo'?'berdua, saling setuju':mode==='solo'?'sendiri':'host: '+(m.list.find(x=>x.id===host)||{}).name);
   if(prevHost&&prevHost!==host)sys((m.list.find(x=>x.id===host)||{}).name+' jadi host');ui()}
  else if(m.t==='state'){m.at=Date.now();applyState(m)}
  else if(m.t==='chat')chat(m);
  else if(m.t==='history'){loadingHist=true;sys('Riwayat chat');m.list.forEach(x=>chat({from:x.from,text:x.text,id:x.from===name?me:0}));sys('Baru bergabung');loadingHist=false}
  else if(m.t==='proposal')proposal(m);
  else if(m.t==='kicked'||m.t==='replaced'){leaving=true;toast(m.t==='kicked'?'Kamu dikeluarkan oleh host':'Akun dipakai di perangkat lain');setTimeout(()=>location.replace(location.pathname),1600)}
  else if(m.t==='err')toast(m.msg)};
}
const act=(k,extra)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(Object.assign({t:'act',k,pos:cur()},extra||{})))};
const canAct=()=>mode!=='host'||host===me;
function ui(){const c=canAct();['pp','seek','url','load'].forEach(i=>$(i).disabled=!c)}
function parse(u){u=u.trim();let m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
 if(m)return{type:'yt',id:m[1],url:u};return /^https?:\/\//i.test(u)?{type:'url',url:u}:null}
$('load').onclick=()=>{const v=parse($('url').value);if(!v)return toast('Link tidak valid');act('load',{video:v});$('url').value=''};
$('pp').onclick=()=>act(playing?'pause':'play');
$('seek').onchange=()=>{dragging=false;act('seek',{pos:$('seek').value/1000*dur()})};
$('seek').oninput=()=>dragging=true;
function cur(){try{return yt?yt.getCurrentTime():el?el.currentTime:0}catch(e){return 0}}
function dur(){try{return(yt?yt.getDuration():el?el.duration:0)||0}catch(e){return 0}}
function loadYT(){if(window.YT&&YT.Player){mountYT();return}
 if(document.getElementById('ytapi'))return;const s=document.createElement('script');s.id='ytapi';s.src='https://www.youtube.com/iframe_api';document.head.appendChild(s);
 window.onYouTubeIframeAPIReady=()=>{if(vid&&vid.type==='yt')mountYT()}}
function clear(){const s=$('stage');if(yt){try{yt.destroy()}catch(e){}yt=null}if(el){el.pause();el=null}
 [...s.children].forEach(c=>{if(!c.hasAttribute('data-keep'))c.remove()})}
function mountYT(){clear();const d=document.createElement('div');d.id='ytp';$('stage').appendChild(d);
 yt=new YT.Player('ytp',{videoId:vid.id,playerVars:{controls:0,disablekb:1,playsinline:1,rel:0,modestbranding:1,fs:0},
  events:{onReady:()=>{if(sync)applyState(sync)},onError:()=>toast('Video tidak bisa diputar')}})}
function mountEl(){clear();el=document.createElement('video');el.playsInline=true;el.setAttribute('playsinline','');el.src=vid.url;
 el.onerror=()=>toast('Video tidak bisa diputar');el.onloadedmetadata=()=>{if(sync)applyState(sync)};$('stage').appendChild(el)}
function ub(){let b=$('unm');if(!b){b=document.createElement('button');b.id='unm';b.textContent='Ketuk untuk menyalakan suara';
 b.onclick=()=>{try{yt?yt.unMute():(el.muted=false)}catch(e){}b.style.display='none'};$('stage').appendChild(b)}return b}
function isPlaying(){try{return yt?[1,3].includes(yt.getPlayerState()):!!el&&!el.paused}catch(e){return false}}
function kick(){if(!sync||!sync.playing||(!yt&&!el))return;
 try{if(isPlaying())return;if(yt){yt.mute();yt.playVideo()}else{el.muted=true;el.play().catch(()=>{})}ub().style.display='block'}catch(e){}}
function expect(s){return s.playing?s.pos+(Date.now()-s.at)/1000:s.pos}
function applyState(s){sync=s;const nv=s.video;if(!nv)return;
 if(!vid||JSON.stringify(vid)!==JSON.stringify(nv)){vid=nv;
  if(vid.type==='yt')loadYT();else mountEl();return}
 playing=s.playing;$('pp').textContent=playing?'❚❚':'▶';
 if(!yt&&!el)return;
 try{const p=expect(s);if(Math.abs(cur()-p)>(s.playing?2.5:0.8)&&!(s.playing&&buf()&&Date.now()-(window.lastFix||0)<6000)){window.lastFix=Date.now();yt?yt.seekTo(p,true):(el.currentTime=p)}
  if(playing){yt?yt.playVideo():el.play().catch(kick)}else{yt?yt.pauseVideo():el.pause()}}catch(e){}
 if(playing)setTimeout(kick,2500)}
setInterval(()=>{const d=dur();if(!dragging&&d)$('seek').value=cur()/d*1000;$('tm').textContent=fmt(cur())+(d?' / '+fmt(d):'')},500);
setInterval(()=>{if(host===me&&mode==='host'&&playing&&ws.readyState===1)ws.send(JSON.stringify({t:'tick',pos:cur()}))},4000);
setInterval(()=>{if(sync&&sync.playing&&(yt||el)){kick();try{const p=expect(sync);if(Math.abs(cur()-p)>4&&!buf()&&Date.now()-(window.lastFix||0)>10000){window.lastFix=Date.now();yt?yt.seekTo(p,true):(el.currentTime=p)}}catch(e){}}},3000);
function proposal(m){const p=m.p,b=$('prop');if(!p){b.style.display='none';if(m.ok===false)toast('Usulan ditolak');return}
 b.style.display='flex';const mine=p.by===me;$('pt').textContent=mine?'Menunggu persetujuan untuk '+p.label+'…':p.name+' ingin '+p.label;
 $('yes').style.display=$('no').style.display=mine?'none':'inline-block'}
$('yes').onclick=()=>ws.send(JSON.stringify({t:'vote',ok:true}));$('no').onclick=()=>ws.send(JSON.stringify({t:'vote',ok:false}));
function add(c,cls){const d=document.createElement('div');d.className='m '+cls;d.appendChild(c);const l=$('msgs');l.appendChild(d);l.scrollTop=l.scrollHeight;while(l.children.length>200)l.removeChild(l.firstChild)}
function chat(m){const f=document.createDocumentFragment();const s=document.createElement('small');s.textContent=m.from;const t=document.createTextNode(m.text);
 if(m.id!==me)f.appendChild(s);f.appendChild(t);add(f,m.id===me?'me':'')}
function sys(t){add(document.createTextNode(t),'sys')}
const send=()=>{const t=$('msg').value.trim();if(t&&ws.readyState===1){ws.send(JSON.stringify({t:'chat',text:t}));$('msg').value=''}};
$('snd').onclick=send;$('msg').onkeydown=e=>{if(e.key==='Enter')send()};
$('share').onclick=()=>{const u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('Link disalin'),()=>prompt('Salin link:',u))};
window.addEventListener('load',()=>{['sync2.js','subs.js','recap.js'].forEach(s=>{const e=document.createElement('script');e.src=s;e.async=false;document.body.appendChild(e)})});
