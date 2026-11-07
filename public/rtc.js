(()=>{
const ICE={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]};
const $=id=>document.getElementById(id),peers=new Map(),names=new Map(),local=new MediaStream();
let mic=null,cam=null;
const st=document.createElement('style');st.textContent=`
#tiles{display:none;gap:8px;overflow-x:auto;padding:0 2px}
.tile{position:relative;flex:0 0 auto;width:96px;height:72px;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.12);border:1px solid var(--edge)}
.tile video{width:100%;height:100%;object-fit:cover}.tile.nov video{opacity:0}
.tile.nov::before{content:attr(data-i);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:var(--mute)}
.tile i{position:absolute;left:0;right:0;bottom:0;font:11px/1.6 system-ui;font-style:normal;text-align:center;background:rgba(0,0,0,.45);overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.grp{display:flex;gap:6px}.grp button{padding:6px 12px}.grp button.on{background:rgba(127,214,255,.35);border-color:var(--acc)}`;
document.head.appendChild(st);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{onMsg(JSON.parse(e.data))}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
const top=document.querySelector('.top'),share=$('share'),grp=document.createElement('span');grp.className='grp';
const bm=document.createElement('button'),bc=document.createElement('button');bm.textContent='🎤';bc.textContent='📷';
top.insertBefore(grp,share);grp.append(bm,bc,share);
const tiles=document.createElement('div');tiles.id='tiles';$('stage').after(tiles);
const showTiles=()=>tiles.style.display=tiles.children.length?'flex':'none';
function tile(id){let t=$('t'+id);if(!t){t=document.createElement('div');t.id='t'+id;t.className='tile nov';t.innerHTML='<video autoplay playsinline></video><i></i>';tiles.appendChild(t)}
 const n=id==='self'?'Kamu':(names.get(id)||'?');t.querySelector('i').textContent=n;t.dataset.i=n[0]||'?';showTiles();return t}
const sig=(to,data)=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify({t:'sig',to,data}))}catch(e){}};
function mk(id){
 const pc=new RTCPeerConnection(ICE),p={pc,polite:me>id,making:false,ignore:false};peers.set(id,p);
 pc.onicecandidate=e=>e.candidate&&sig(id,{c:e.candidate});
 pc.onnegotiationneeded=async()=>{try{p.making=true;await pc.setLocalDescription(await pc.createOffer());sig(id,{d:pc.localDescription})}catch(e){}finally{p.making=false}};
 pc.oniceconnectionstatechange=()=>{if(pc.iceConnectionState==='failed'&&pc.restartIce)pc.restartIce()};
 pc.ontrack=e=>{const s=e.streams[0]||new MediaStream([e.track]),t=tile(id),v=t.querySelector('video');
  if(v.srcObject!==s)v.srcObject=s;
  const upd=()=>t.classList.toggle('nov',!s.getVideoTracks().some(x=>x.readyState==='live'&&!x.muted));
  e.track.onmute=upd;e.track.onunmute=upd;e.track.onended=upd;s.onremovetrack=upd;upd();v.play().catch(()=>{})};
 local.getTracks().forEach(t=>pc.addTrack(t,local));return p}
async function onSig(from,d){const p=peers.get(from)||mk(from),pc=p.pc;
 try{if(d.d){const col=d.d.type==='offer'&&(p.making||pc.signalingState!=='stable');p.ignore=!p.polite&&col;if(p.ignore)return;
  await pc.setRemoteDescription(d.d);
  if(d.d.type==='offer'){await pc.setLocalDescription(await pc.createAnswer());sig(from,{d:pc.localDescription})}}
 else if(d.c){try{await pc.addIceCandidate(d.c)}catch(e){if(!p.ignore)throw e}}}catch(e){}}
function onMsg(m){
 if(m.t==='members'){m.list.forEach(x=>names.set(x.id,x.name));const ids=new Set(m.list.map(x=>x.id));
  ids.forEach(id=>{if(id!==me&&!peers.has(id))mk(id);const t=$('t'+id);if(t)tile(id)});
  peers.forEach((p,id)=>{if(!ids.has(id)){p.pc.close();peers.delete(id);const t=$('t'+id);if(t)t.remove();showTiles()}})}
 else if(m.t==='sig')onSig(m.from,m.data)}
const push=t=>{local.addTrack(t);peers.forEach(p=>p.pc.addTrack(t,local))};
const gum=async c=>{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('Browser tidak mendukung');return null}
 try{return await navigator.mediaDevices.getUserMedia(c)}catch(e){toast('Izin mic/kamera ditolak');return null}};
bm.onclick=async()=>{
 if(!mic){const s=await gum({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});if(!s)return;mic=s.getAudioTracks()[0];push(mic);bm.classList.add('on');bm.textContent='🎤'}
 else{mic.enabled=!mic.enabled;bm.classList.toggle('on',mic.enabled);bm.textContent=mic.enabled?'🎤':'🔇'}};
bc.onclick=async()=>{
 if(!cam){const s=await gum({video:{width:{ideal:240},height:{ideal:180},frameRate:{ideal:15,max:20},facingMode:'user'}});if(!s)return;
  cam=s.getVideoTracks()[0];push(cam);const t=tile('self'),v=t.querySelector('video');v.muted=true;v.srcObject=new MediaStream([cam]);t.classList.remove('nov');v.play().catch(()=>{});bc.classList.add('on')}
 else{peers.forEach(p=>p.pc.getSenders().forEach(s=>{if(s.track===cam)try{p.pc.removeTrack(s)}catch(e){}}));
  local.removeTrack(cam);cam.stop();cam=null;const t=$('tself');if(t)t.remove();showTiles();bc.classList.remove('on')}};
})();
