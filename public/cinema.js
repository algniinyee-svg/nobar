(()=>{
const $=id=>document.getElementById(id),s=$('stage');
const st=document.createElement('style');st.textContent=`
#stage>#cine{inset:auto 12px 64px 12px;width:auto;height:auto;pointer-events:none;flex-direction:column;align-items:flex-start;gap:6px;z-index:6}
.cm{max-width:80%;padding:6px 12px;border-radius:16px;background:rgba(10,14,30,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-size:14px;color:#fff;animation:cmi .25s ease-out;transition:opacity .6s}
.cm b{color:#9be7ff;font-weight:600;margin-right:6px}
@keyframes cmi{from{opacity:0;transform:translateY(8px)}}
#stage>#cbtn{z-index:7;inset:auto 12px 12px auto;width:auto;height:auto;padding:8px 14px;background:rgba(20,26,48,.75)}
#stage>#crow{z-index:8;inset:auto 12px 12px 12px;width:auto;height:auto;gap:8px}
#crow input{flex:1;min-width:0;background:rgba(20,26,48,.85)}`;
document.head.appendChild(st);
let open=false,cine,cbtn,crow,ci;
const fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement)||s.classList.contains('pfs');
function ensure(){
 if(cine&&cine.parentNode===s)return;
 cine=document.createElement('div');cine.id='cine';cine.style.display='none';
 cbtn=document.createElement('button');cbtn.id='cbtn';cbtn.textContent='💬';cbtn.style.display='none';
 crow=document.createElement('div');crow.id='crow';crow.style.display='none';
 ci=document.createElement('input');ci.placeholder='Ketik pesan…';ci.maxLength=300;ci.autocomplete='off';
 const sb=document.createElement('button');sb.textContent='Kirim';const cx=document.createElement('button');cx.textContent='✕';
 const go=()=>{const t=ci.value.trim();if(t&&ws.readyState===1){ws.send(JSON.stringify({t:'chat',text:t}));ci.value=''}};
 sb.onclick=go;ci.onkeydown=e=>{if(e.key==='Enter')go()};
 cbtn.onclick=()=>{open=true;sync2();setTimeout(()=>ci.focus(),50)};cx.onclick=()=>{open=false;sync2()};
 crow.append(ci,sb,cx);s.append(cine,cbtn,crow)}
function sync2(){ensure();const f=fsOn();if(!f)open=false;
 cine.style.display=f?'flex':'none';cbtn.style.display=f&&!open?'block':'none';crow.style.display=f&&open?'flex':'none'}
function cm(m){ensure();const d=document.createElement('div');d.className='cm';
 const b=document.createElement('b');b.textContent=m.from;d.append(b,document.createTextNode(m.text));cine.appendChild(d);
 while(cine.children.length>4)cine.firstChild.remove();
 setTimeout(()=>{d.style.opacity='0'},6400);setTimeout(()=>d.remove(),7000)}
const _chat=window.chat;window.chat=function(m){_chat(m);if(!loadingHist)cm(m)};
['fullscreenchange','webkitfullscreenchange'].forEach(e=>document.addEventListener(e,sync2));
setInterval(sync2,700);
})();
