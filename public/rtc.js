(()=>{
let ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
const $=id=>document.getElementById(id),peers=new Map(),names=new Map(),auds=[],spk=new Set();
let mic=null,cam=null,ctx=null,list=[],icePromise=null;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function loadIce(){if(!icePromise)icePromise=fetch('/api/ice',{headers:{Authorization:'Bearer '+TOKEN}}).then(r=>r.ok?r.json():null)
 .then(j=>{if(j&&Array.isArray(j.iceServers)&&j.iceServers.length)ICE={iceServers:j.iceServers.concat(ICE.iceServers)}}).catch(()=>{});return icePromise}
const iceReady=()=>Promise.race([loadIce(),wait(3500)]);
const st=document.createElement('style');st.textContent=`
.top{flex-wrap:wrap}
#tiles{display:none;gap:8px;overflow-x:auto;padding:4px 2px}
.tile{position:relative;flex:0 0 auto;width:96px;height:72px;border-radius:18px;overflow:hidden;background:rgba(255,255,255,.12);border:1px solid var(--edge)}
.tile video{width:100%;height:100%;object-fit:cover}.tile.nov video{opacity:0}
.tile.nov::before{content:attr(data-i);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:var(--mute)}
.tile i{position:absolute;left:0;right:0;bottom:0;font:11px/1.6 system-ui;font-style:normal;text-align:center;background:rgba(0,0,0,.45);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.tile.spk{box-shadow:0 0 0 2px #7fd6ff,0 0 16px #7fd6ff}
.grp{display:flex;gap:6px}.grp button{padding:6px 10px}.grp button.on{background:rgba(127,214,255,.35);border-color:var(--acc)}
#ppl{display:none;position:fixed;inset:0;z-index:20;background:rgba(0,0,0,.4);align-items:flex-end;justify-content:center}
#ppl.on{display:flex}#ppl>.glass{width:100%;max-width:640px;margin:10px;padding:16px;max-height:70dvh;overflow:auto}
.pr{display:flex;align-items:center;gap:10px;padding:8px 2px}.pr span{flex:1;word-break:break-word}
.pr .d{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.25)}.pr.spk .d{background:#5dff9a;box-shadow:0 0 8px #5dff9a}
.pr small{color:var(--mute);font-size:12px;white-space:nowrap}
#stage:fullscreen{aspect-ratio:auto;border-radius:0;border:0;width:100vw;height:100vh}
#stage:-webkit-full-screen{aspect-ratio:auto;border-radius:0;border:0;width:100vw;height:100vh}`;
document.head.appendChild(st);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{onMsg(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
const top=document.querySelector('.top'),share=$('share'),grp=document.createElement('span');grp.className='grp';
const mkb=t=>{const b=document.createElement('button');b.textContent=t;return b};
const bm=mkb('🎤'),bc=mkb('📷'),bp=mkb('👥');
top.insertBefore(grp,share);grp.append(bm,bc,bp,share);
const tiles=document.createElement('div');tiles.id='tiles';$('stage').after(tiles);
const showTiles=()=>tiles.style.display=tiles.children.length?'flex':'none';
function tile(id){let t=$('t'+id);if(!t){t=document.createElement('div');t.id='t'+id;t.className='tile nov';t.innerHTML='<video autoplay playsinline muted></video><i></i>';tiles.appendChild(t)}
 const n=names.get(id)||'?';t.querySelector('i').textContent=id===me?'Kamu':n;t.dataset.i=(n[0]||'?').toUpperCase();showTiles();return t}
const sig=(to,data)=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify({t:'sig',to,data}))}catch(e){}};
function setSpk(id,on){if(on===spk.has(id))return;on?spk.add(id):spk.delete(id);
  const t=$('t'+id);if(t)t.classList.toggle('spk',on);document.querySelectorAll('.pr[data-id="'+id+'"],.seat[data-id="'+id+'"]').forEach(e=>e.classList.toggle('spk',on))}
function watch(s,id){try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();const a=ctx.createAnalyser();a.fftSize=256;ctx.createMediaStreamSource(s).connect(a);
 const buf=new Uint8Array(a.frequencyBinCount);let hold=0;
 return setInterval(()=>{a.getByteFrequencyData(buf);let v=0;for(const x of buf)v+=x;v/=buf.length;if(v>14)hold=3;else if(hold)hold--;setSpk(id,hold>0)},150)}catch(e){}}
const kindOf=t=>t.receiver.track.kind;
function attach(p){p.pc.getTransceivers().forEach(t=>{t.direction='sendrecv';t.sender.replaceTrack(kindOf(t)==='audio'?mic:cam).catch(()=>{})})}
async function route(p){try{const s=await p.pc.getStats();let pid=null;
 s.forEach(r=>{if(r.type==='transport'&&r.selectedCandidatePairId)pid=r.selectedCandidatePairId});
 if(!pid)s.forEach(r=>{if(r.type==='candidate-pair'&&r.nominated&&r.state==='succeeded')pid=r.id});
 const cp=pid&&s.get(pid);if(cp){const l=s.get(cp.localCandidateId),rm=s.get(cp.remoteCandidateId);
    p.route=(l&&l.candidateType==='relay')||(rm&&rm.candidateType==='relay')?'relay':'direct';if(p.route==='relay')capRelay(p)}}catch(e){}render()}
function capRelay(p){p.pc._relay=true;try{p.pc.getTransceivers().forEach(t=>{const s=t.sender,k=t.receiver.track.kind,pr=s.getParameters();if(!pr.encodings||!pr.encodings.length)pr.encodings=[{}];
 if(k==='video'){pr.encodings[0].maxBitrate=60000;pr.encodings[0].maxFramerate=8;pr.encodings[0].scaleResolutionDownBy=2}else pr.encodings[0].maxBitrate=24000;s.setParameters(pr).catch(()=>{})})}catch(e){}}
function mk(id){
 const pc=new RTCPeerConnection(ICE),p={pc,polite:me>id,making:false,ignore:false,as:new MediaStream(),vs:new MediaStream(),cam:false,st:'new',route:''};peers.set(id,p);
 pc.onicecandidate=e=>e.candidate&&sig(id,{c:e.candidate});
 pc.onnegotiationneeded=async()=>{try{p.making=true;await pc.setLocalDescription(await pc.createOffer());sig(id,{d:pc.localDescription})}catch(e){}finally{p.making=false}};
 pc.oniceconnectionstatechange=()=>{p.st=pc.iceConnectionState;
  if(p.st==='failed'&&pc.restartIce)pc.restartIce();
  if(p.st==='connected'||p.st==='completed')setTimeout(()=>route(p),800);render()};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected')sig(id,{cam:!!cam})};
 pc.ontrack=e=>{const t=e.track;
  if(t.kind==='audio'){p.as.addTrack(t);if(!p.au){p.au=document.createElement('audio');p.au.autoplay=true;p.au.muted=false;p.au.volume=1;p.au.setAttribute('playsinline','');p.au.srcObject=p.as;document.body.appendChild(p.au);auds.push(p.au);p.w=watch(p.as,id)}p.au.play().catch(()=>{})}
  else{p.vs.addTrack(t);const tl=tile(id),v=tl.querySelector('video');if(v.srcObject!==p.vs)v.srcObject=p.vs;tl.classList.toggle('nov',!p.cam);v.play().catch(()=>{})}};
 if(!p.polite){pc.addTransceiver('audio',{direction:'sendrecv'});pc.addTransceiver('video',{direction:'sendrecv'});attach(p)}
 return p}
async function ensure(id){const p=peers.get(id);if(p)return p;await iceReady();return peers.get(id)||mk(id)}
async function onSig(from,d){
 if('cam' in d){const p=peers.get(from);if(p){p.cam=!!d.cam;const t=$('t'+from);if(t)t.classList.toggle('nov',!d.cam)}return}
 const p=await ensure(from),pc=p.pc;
 try{if(d.d){const col=d.d.type==='offer'&&(p.making||pc.signalingState!=='stable');p.ignore=!p.polite&&col;if(p.ignore)return;
  await pc.setRemoteDescription(d.d);
  if(d.d.type==='offer'){attach(p);await pc.setLocalDescription(await pc.createAnswer());sig(from,{d:pc.localDescription})}}
 else if(d.c){try{await pc.addIceCandidate(d.c)}catch(e){if(!p.ignore)throw e}}}catch(e){}}
function label(p){if(!p)return'';if(p.st==='connected'||p.st==='completed')return p.route==='relay'?'🟠 relay':p.route==='direct'?'🟢 langsung':'🟢 tersambung';
 if(p.st==='failed'||p.st==='disconnected'||p.st==='closed')return'🔴 gagal';return'🟡 menyambung'}
function render(){const b=$('plist');if(!b)return;b.innerHTML='';
 list.forEach(x=>{const r=document.createElement('div');r.className='pr'+(spk.has(x.id)?' spk':'');r.dataset.id=x.id;
  const d=document.createElement('i');d.className='d';const n=document.createElement('span');
  n.textContent=x.name+(x.id===me?' (kamu)':'')+(x.id===host?' 👑':'');r.append(d,n);
  if(x.id!==me){const sm=document.createElement('small');sm.textContent=label(peers.get(x.id));r.append(sm)}
  if(host===me&&x.id!==me){const bt=(l,f)=>{const k=mkb(l);k.style.padding='6px 10px';k.onclick=f;r.append(k)},tx=o=>ws.send(JSON.stringify(o));
   if(mode==='host')bt('🔇',()=>tx({t:'mute',to:x.id}));
   bt('👑',()=>{if(confirm('Jadikan '+x.name+' sebagai host?'))tx({t:'givehost',to:x.id})});
   bt('🚪',()=>{if(confirm('Keluarkan '+x.name+' dari room?'))tx({t:'kick',to:x.id})})}
  b.appendChild(r)})}
async function onMsg(m){
 if(m.t==='members'){list=m.list;m.list.forEach(x=>names.set(x.id,x.name));const ids=new Set(m.list.map(x=>x.id));
  m.list.forEach(x=>{if($('t'+x.id)||x.id===me)tile(x.id)});
  peers.forEach((p,id)=>{if(!ids.has(id)){p.pc.close();peers.delete(id);clearInterval(p.w);setSpk(id,false);
   if(p.au){p.au.remove();const i=auds.indexOf(p.au);if(i>-1)auds.splice(i,1)}const t=$('t'+id);if(t)t.remove();showTiles()}});
  render();
  for(const x of m.list){if(x.id!==me&&!peers.has(x.id))await ensure(x.id)}
  render()}
 else if(m.t==='sig')onSig(m.from,m.data)
 else if(m.t==='mute'&&mic){mic.enabled=false;micUI();toast('Host membisukan mic kamu')}}
const micUI=()=>{bm.classList.toggle('on',!!mic&&mic.enabled);bm.textContent=mic&&!mic.enabled?'🔇':'🎤'};
const gum=async c=>{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Browser tidak mendukung');return null}
 try{return await navigator.mediaDevices.getUserMedia(c)}catch(e){toast('Izin mic/kamera ditolak');return null}};
bm.onclick=async()=>{
 if(!mic){const s=await gum({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(!s)return;
  mic=s.getAudioTracks()[0];peers.forEach(attach);watch(new MediaStream([mic]),me)}
 else mic.enabled=!mic.enabled;
 micUI()};
const cs=b=>peers.forEach((p,id)=>sig(id,{cam:b}));
bc.onclick=async()=>{
 if(!cam){const s=await gum({video:{width:{ideal:240},height:{ideal:180},frameRate:{ideal:15,max:20},facingMode:'user'}});if(!s)return;
  cam=s.getVideoTracks()[0];peers.forEach(attach);const t=tile(me),v=t.querySelector('video');v.srcObject=new MediaStream([cam]);v.play().catch(()=>{});t.classList.remove('nov');bc.classList.add('on');cs(true)}
 else{cam.stop();cam=null;peers.forEach(attach);tile(me).classList.add('nov');bc.classList.remove('on');cs(false)}};
const pn=document.createElement('div');pn.id='ppl';
pn.innerHTML='<div class="glass"><b>Peserta</b><div id="plist"></div><button id="pcl" style="width:100%;margin-top:8px">Tutup</button></div>';document.body.appendChild(pn);
bp.onclick=()=>{render();pn.classList.add('on')};$('pcl').onclick=()=>pn.classList.remove('on');pn.onclick=e=>{if(e.target===pn)pn.classList.remove('on')};
const bf=mkb('⛶');bf.style.padding='10px 14px';$('seek').parentNode.appendChild(bf);
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
bf.onclick=()=>{const s=$('stage');
 if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
 const f=s.requestFullscreen||s.webkitRequestFullscreen;if(!f)return toast('Layar penuh tidak didukung');
 Promise.resolve(f.call(s)).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>toast('Layar penuh gagal'))};
document.addEventListener('fullscreenchange',()=>{if(!fsEl())try{screen.orientation.unlock()}catch(e){}});
const ab=mkb('🔊 Ketuk untuk menyalakan suara');
ab.style.cssText='display:none;position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);z-index:90;padding:10px 18px;background:rgba(20,26,48,.92)';
document.body.appendChild(ab);
const wake=()=>{auds.forEach(a=>a.paused&&a.play().catch(()=>{}));if(ctx&&ctx.state==='suspended')ctx.resume()};
ab.onclick=()=>{wake();ab.style.display='none'};
setInterval(()=>{ab.style.display=auds.some(a=>a.paused&&a.srcObject&&a.srcObject.getAudioTracks().length)?'block':'none'},2000);
document.addEventListener('pointerdown',wake,{passive:true});
})();
