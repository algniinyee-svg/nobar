(()=>{
const C=window.Capacitor;
if(!(C&&C.isNativePlatform&&C.isNativePlatform()))return;
window.NB_APP=true;
const $=id=>document.getElementById(id);
const LS={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
window.nbNative=(m,a)=>{try{
 if(C.nativePromise)return C.nativePromise('NobarNative',m,a||{});
 const P=C.Plugins&&C.Plugins.NobarNative;if(P&&P[m])return P[m](a||{})}catch(e){return Promise.reject(e)}
 return Promise.reject('Perbarui aplikasi ke versi terbaru')};
const call=(m,a)=>{try{window.nbNative(m,a).catch(()=>{})}catch(e){}};
const st=document.createElement('style');
st.textContent=`#apkbtn{display:none!important}
#nx{display:none;position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);right:8px;z-index:40;width:36px;height:36px;padding:0;border-radius:50%;font-size:15px;line-height:1;background:rgba(20,26,48,.85)}
#stage.pfs>#prop{right:54px!important}
#stage.pfs>#jr{right:54px!important}`;
document.head.appendChild(st);
const stage=$('stage'),nx=document.createElement('button');nx.id='nx';nx.textContent='✕';nx.setAttribute('aria-label','Tutup layar penuh');document.body.appendChild(nx);
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
/* ---------- notifikasi Firebase (FCM) ---------- */
const PN=()=>C.Plugins&&C.Plugins.PushNotifications;
const flagKey=()=>'nb-fcm:'+(USER||'').toLowerCase();
const flagOn=()=>LS.g(flagKey())!=='0';
const setFlag=v=>{LS.s(flagKey(),v?'1':'0');LS.s('nb-p',v?'1':'0')};
let fcmTok='',inited=false,started=false,pu='\u0000',pTok='',synced='';
const hdr=t=>({'Content-Type':'application/json',Authorization:'Bearer '+t});
const post=(u,t,b)=>fetch(u,{method:'POST',headers:hdr(t),body:JSON.stringify(b||{})}).catch(()=>{});
const pdata=n=>{const d=(n&&n.data)||{};return{title:n.title||d.title||'Nobar',body:n.body||'',tag:d.tag||'',url:d.url||'/',inv:d.room?{room:d.room,pw:d.pw||'',from:d.from||''}:null}};
async function init(){
 const P=PN();if(!P)throw'Plugin notifikasi tidak tersedia';
 if(inited)return P;inited=true;
 try{await P.createChannel({id:'nobar',name:'Nobar',description:'Undangan dan aktivitas room',importance:4,visibility:1,vibration:true})}catch(e){}
 P.addListener('registration',t=>{fcmTok=(t&&t.value)||'';synced=''});
 P.addListener('registrationError',()=>{});
 P.addListener('pushNotificationReceived',n=>{if(window.nbPushIn)window.nbPushIn(pdata(n))});
 P.addListener('pushNotificationActionPerformed',a=>{if(window.nbPushTap)window.nbPushTap(pdata((a&&a.notification)||{}))});
 return P}
async function on(){
 const P=await init();let p=await P.checkPermissions();
 if(p.receive!=='granted')p=await P.requestPermissions();
 if(p.receive!=='granted'){setFlag(false);throw'Izin notifikasi ditolak. Aktifkan lewat Pengaturan Android > Aplikasi > Nobar > Notifikasi'}
 setFlag(true);await P.register()}
async function off(){setFlag(false);if(fcmTok&&TOKEN)await post('/api/fcm/unregister',TOKEN,{token:fcmTok})}
setInterval(()=>{
 if(USER!==pu){if(pu&&pu!=='\u0000'&&fcmTok&&pTok)post('/api/fcm/unregister',pTok,{token:fcmTok});pu=USER;synced='';started=false}
 if(TOKEN&&USER)pTok=TOKEN;
 if(!USER)return;
 if(flagOn()&&!started){started=true;on().catch(()=>{})}
 if(flagOn()&&fcmTok&&synced!==USER+fcmTok){synced=USER+fcmTok;post('/api/fcm/register',TOKEN,{token:fcmTok})}
},1500);
window.nbPush={supported:()=>true,isOn:()=>!!USER&&flagOn(),on,off};
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
 if(n.nodeType!==1||!n.classList||!n.classList.contains('ov')||!/Pengaturan/.test(n.textContent))return;
 setTimeout(()=>{
  const b=[...n.querySelectorAll('button')].find(x=>/^(🔔|🔕) Push|Push tidak didukung/.test(x.textContent.trim()));if(!b)return;
  const sp=n.querySelector('#nbst'),say=t=>{if(sp)sp.textContent=t};
  const lab=()=>{b.textContent=flagOn()?'🔔 Notifikasi aplikasi: Aktif':'🔕 Notifikasi aplikasi: Mati'};lab();
  b.onclick=async()=>{b.disabled=true;say('Memproses…');
   try{if(flagOn()){await off();say('Notifikasi aplikasi dimatikan.')}else{if(!USER)throw'Login dulu';await on();say('✅ Aktif. Ketuk "Tes notifikasi" untuk mencoba.')}}
   catch(e){say('⚠️ '+(typeof e==='string'?e:'Gagal'))}
   b.disabled=false;lab()}},60)}))).observe(document.body,{childList:true});
})();
