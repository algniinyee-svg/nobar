(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const OPEN='\u27EA',CLOSE='\u27EB',RE=/^\u27EA([^|\u27EB]{1,16})\|([^\u27EB]{0,80})\u27EB/;
const st=document.createElement('style');st.textContent=`
.rq{border-left:3px solid var(--acc);padding:2px 8px;margin-bottom:4px;font-size:12px;color:var(--mute);background:rgba(0,0,0,.18);border-radius:8px;word-break:break-word}
.rq b{color:var(--ink);margin-right:4px}.m{cursor:pointer}
.mn{color:#9be7ff;font-weight:600}.mn.me{background:rgba(127,214,255,.3);border-radius:6px;padding:0 4px}
.m.mentioned{box-shadow:0 0 0 1.5px var(--acc)}
.rbar{align-items:center;gap:8px;padding:4px 6px;font-size:12px;color:var(--mute)}.rbar span{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.rbar button{padding:2px 10px}
.msug{gap:6px;overflow-x:auto;padding:4px 2px}.msug button{padding:5px 12px;white-space:nowrap}`;
document.head.appendChild(st);
let replyTo=null,mem=[];
const chatEl=$('chat'),row=chatEl.querySelector('.row'),msg=$('msg');
const bar=mk('div',0,'rbar');bar.style.display='none';chatEl.insertBefore(bar,row);
const sug=mk('div',0,'msug');sug.style.display='none';chatEl.insertBefore(sug,row);
function setReply(r){replyTo=r;bar.innerHTML='';
 if(!r){bar.style.display='none';msg.maxLength=300;return}
 bar.style.display='flex';const x=mk('button','✕');x.onclick=()=>setReply(null);bar.append(mk('span','↩ '+r.from+': '+r.text),x);
 msg.maxLength=300-(r.from.length+r.text.length+3);msg.focus()}
const OW=window.WebSocket,S0=OW.prototype.send;
OW.prototype.send=function(d){
 if(typeof d==='string'&&replyTo&&d.indexOf('"t":"chat"')>0){try{const o=JSON.parse(d);
  if(o.t==='chat'&&typeof o.text==='string'){o.text=OPEN+replyTo.from+'|'+replyTo.text.replace(/[|\u27EB]/g,' ')+CLOSE+o.text;d=JSON.stringify(o);setReply(null)}}catch(e){}}
 return S0.call(this,d)};
window.WebSocket=function(u,p){const w=new OW(u,p);w.addEventListener('message',e=>{try{const m=JSON.parse(e.data);if(m.t==='members')mem=m.list}catch(x){}});return w};
window.WebSocket.prototype=OW.prototype;
function decorate(d,m,rq){
 const t=[...d.childNodes].filter(n=>n.nodeType===3).pop();if(!t)return;
 const frag=document.createDocumentFragment(),mine=(USER||name||'').toLowerCase();let ment=false;
 if(rq){const q=mk('div',0,'rq');q.append(mk('b',rq.from),document.createTextNode(rq.text));frag.appendChild(q)}
 t.nodeValue.split(/(@[A-Za-z0-9_.-]{3,16})/g).forEach(p=>{
  if(/^@[A-Za-z0-9_.-]{3,16}$/.test(p)){const s=mk('b',p,'mn');if(p.slice(1).toLowerCase()===mine){s.classList.add('me');ment=true}frag.appendChild(s)}
  else if(p)frag.appendChild(document.createTextNode(p))});
 t.replaceWith(frag);
 if(ment&&m.id!==me){d.classList.add('mentioned');if(!loadingHist){toast(m.from+' menyebutmu');if(navigator.vibrate)try{navigator.vibrate([80,40,80])}catch(e){}}}
 const txt=m.text.slice(0,60);d.onclick=()=>setReply({from:m.from,text:txt})}
const _chat=window.chat;
window.chat=function(m){
 const mm=String(m.text).match(RE),rq=mm?{from:mm[1],text:mm[2]}:null,m2=mm?Object.assign({},m,{text:m.text.slice(mm[0].length)}):m;
 _chat(m2);const d=$('msgs').lastElementChild;if(!d||d.classList.contains('sys'))return;decorate(d,m2,rq)};
msg.addEventListener('input',()=>{const mm=msg.value.match(/@([A-Za-z0-9_.-]{0,16})$/);sug.innerHTML='';
 if(!mm){sug.style.display='none';return}
 const q=mm[1].toLowerCase(),c=mem.filter(x=>x.id!==me&&x.name.toLowerCase().startsWith(q)).slice(0,5);
 if(!c.length){sug.style.display='none';return}
 sug.style.display='flex';
 c.forEach(x=>{const b=mk('button','@'+x.name);b.onclick=()=>{msg.value=msg.value.replace(/@([A-Za-z0-9_.-]{0,16})$/,'@'+x.name+' ');sug.style.display='none';msg.focus()};sug.appendChild(b)})});
})();
