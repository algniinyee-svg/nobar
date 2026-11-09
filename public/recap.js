(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const tx=o=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify(o))}catch(e){}};
const bt=mk('button','🎴 Rekap');bt.onclick=()=>{bt.disabled=true;tx({t:'recapreq'});setTimeout(()=>bt.disabled=false,2000)};
if(window.nbTools)window.nbTools.appendChild(bt);
const OW=window.WebSocket;
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.t==='recap')build(m.data)}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
const rr=(x,a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
const card=(x,a,b,w,h)=>{rr(x,a,b,w,h,36);x.fillStyle='rgba(255,255,255,.12)';x.fill();x.lineWidth=2;x.strokeStyle='rgba(255,255,255,.25)';x.stroke()};
const fit=(x,t,max)=>{if(x.measureText(t).width<=max)return t;while(t.length>1&&x.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'};
const dur=s=>{const m=Math.round(s/60);return m<60?m+' menit':Math.floor(m/60)+' j '+(m%60)+' m'};
const top=o=>Object.entries(o||{}).sort((a,b)=>b[1]-a[1])[0];
const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
async function title(v){if(v.type!=='yt')return 'Video link';
 try{const r=await Promise.race([fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+v.id)),new Promise((_,j)=>setTimeout(j,2500))]);
  const j=await r.json();return j.title||('YouTube '+v.id)}catch(e){return 'YouTube '+v.id}}
async function draw(d){
 const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const cs=getComputedStyle(document.documentElement),g=n=>(cs.getPropertyValue(n)||'').trim();
 const cols=[g('--g1')||'#4f6bff',g('--g2')||'#00d4b4',g('--g3')||'#c13bff',g('--g4')||'#ff7a59'];
 x.fillStyle=g('--bgc')||'#0b1020';x.fillRect(0,0,W,H);
 [[180,160,720,0],[W-120,420,620,1],[260,H-160,760,2],[W-220,H-320,520,3]].forEach(([cx,cy,r,i])=>{
  const col=/^#[0-9a-f]{6}/i.test(cols[i])?cols[i].slice(0,7):'#4f6bff',gr=x.createRadialGradient(cx,cy,0,cx,cy,r);
  gr.addColorStop(0,col+'cc');gr.addColorStop(1,col+'00');x.fillStyle=gr;x.fillRect(0,0,W,H)});
 x.textAlign='center';x.fillStyle='#fff';x.font='800 92px system-ui,sans-serif';x.fillText('Nobar',W/2,150);
 x.fillStyle='rgba(255,255,255,.78)';x.font='500 36px system-ui,sans-serif';x.fillText('Rekap nonton bareng',W/2,205);
 x.font='600 34px system-ui,sans-serif';
 x.fillText('Room '+d.code+' · '+new Date(d.now).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),W/2,262);
 x.font='400 30px system-ui,sans-serif';x.fillStyle='rgba(255,255,255,.65)';x.fillText(fit(x,d.users.join(', '),W-160),W/2,310);
 const stats=[[dur(d.watch),'⏱ Waktu nonton'],[String(d.videos.length),'🎬 Film diputar'],[String(d.users.length),'👥 Peserta'],[String(sum(d.msgs)),'💬 Pesan']],pos=[[80,350],[560,350],[80,580],[560,580]];
 stats.forEach((s,i)=>{const[a,b]=pos[i];card(x,a,b,440,200);x.fillStyle='#fff';x.font='800 68px system-ui,sans-serif';x.fillText(s[0],a+220,b+108);
  x.fillStyle='rgba(255,255,255,.72)';x.font='500 30px system-ui,sans-serif';x.fillText(s[1],a+220,b+160)});
 card(x,80,820,920,290);x.textAlign='left';x.fillStyle='#fff';x.font='700 36px system-ui,sans-serif';x.fillText('🎬 Yang kita tonton',120,885);
 const seen=new Set(),vids=[];d.videos.forEach(v=>{const k=JSON.stringify(v);if(!seen.has(k)){seen.add(k);vids.push(v)}});
 const ts=await Promise.all(vids.slice(0,3).map(title));
 x.font='500 32px system-ui,sans-serif';
 if(!ts.length){x.fillStyle='rgba(255,255,255,.6)';x.fillText('Belum ada video yang diputar.',120,950)}
 ts.forEach((t,i)=>{x.fillStyle='rgba(255,255,255,.9)';x.fillText((i+1)+'. '+fit(x,t,820),120,950+i*55)});
 if(vids.length>3){x.fillStyle='rgba(255,255,255,.6)';x.font='400 28px system-ui,sans-serif';x.fillText('+'+(vids.length-3)+' lainnya',120,1100)}
 card(x,80,1140,920,120);x.font='500 32px system-ui,sans-serif';x.fillStyle='#fff';
 const tc=top(d.msgs),tr=top(d.reacts);
 x.fillText('💬 Paling cerewet: '+(tc?fit(x,tc[0],380)+' ('+tc[1]+')':'-'),120,1196);
 x.fillText('😍 Paling ekspresif: '+(tr?fit(x,tr[0],340)+' ('+tr[1]+')':'-'),120,1240);
 x.textAlign='center';x.fillStyle='rgba(255,255,255,.6)';x.font='400 28px system-ui,sans-serif';x.fillText('Nobar · dibuat oleh Algani Hamid',W/2,1316);
 return c}
async function build(d){
 const o=mk('div',0,'ov'),g=mk('div',0,'glass sp'),msg=mk('p','Membuat kartu…','badge');o.appendChild(g);g.append(mk('b','Kartu rekap nobar'),msg);document.body.appendChild(o);
 o.onclick=e=>{if(e.target===o)o.remove()};
 try{const c=await draw(d);c.style.cssText='width:100%;height:auto;border-radius:18px;display:block';msg.remove();g.appendChild(c);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  const sh=mk('button','Bagikan','pri'),sv=mk('button','Simpan gambar'),st=mk('p','','badge');
  sh.onclick=async()=>{try{const f=new File([blob],'rekap-nobar.png',{type:'image/png'});
   if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:'Rekap Nobar',text:'Nobar seru di room '+d.code});
   else st.textContent='Perangkat ini tidak bisa berbagi gambar langsung. Gunakan Simpan gambar.'}catch(e){}};
  sv.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rekap-nobar.png';document.body.appendChild(a);a.click();a.remove();st.textContent='Gambar disimpan ke unduhan.'};
  g.append(sh,sv,st)}
 catch(e){msg.textContent='Gagal membuat kartu.'}}
})();
