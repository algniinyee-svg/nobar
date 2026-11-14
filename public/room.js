(()=>{
const $=id=>document.getElementById(id);
const RC={
 exit:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>',
 film:'<circle cx="12" cy="12" r="10"/><path d="M10 8.5v7l6-3.5z"/>'
};
const wrap=p=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const mask=k=>{const u='url("data:image/svg+xml,'+encodeURIComponent(wrap(RC[k]))+'")';return '-webkit-mask-image:'+u+';mask-image:'+u+';'};
const css=`
/* ---------- header satu baris ---------- */
#room .top{flex-wrap:nowrap!important;padding:6px 10px!important;gap:8px!important}
#room .tl{flex:1 1 auto;min-width:0;gap:8px!important}
#room .tl>div{min-width:0;overflow:hidden}
#room #rc{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#room #info{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#room .grp{flex:none;gap:4px!important}
#room .grp button,#room #leave{width:38px!important;height:38px;min-height:0!important;padding:0!important;display:inline-flex;align-items:center;justify-content:center}
#room #leave:not([data-rc]){width:auto!important;padding:0 14px!important;font-size:13px}
[data-rc]::before{content:"";display:block;width:20px;height:20px;background:currentColor;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain}
[data-rc="exit"]::before{${mask('exit')}}
[data-rc="link"]::before{${mask('link')}}
button[data-rc]{font-size:0!important}
/* ---------- kursi, kontrol, alat ---------- */
#seats{padding:0 4px 4px!important;gap:6px!important}
.seat{width:50px!important}
.seat .av{width:38px!important;height:38px!important;font-size:15px}
.seat b{font-size:10.5px!important;margin-top:4px!important}
.seat .cr{top:-8px!important;right:4px!important;font-size:12px!important}
#room .ctl{padding:6px 8px!important;gap:6px!important}
#room .ctl button{width:40px!important;height:40px;min-height:0!important;padding:0!important}
#room #pp{width:44px!important;height:44px}
#tools{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;padding:0 2px!important}
#tools::-webkit-scrollbar{display:none}
#tools button{flex:none;white-space:nowrap}
/* ---------- baris link ---------- */
#room .row{align-items:center}
#room .row input{height:42px;min-height:0;padding:0 14px}
#room .row>button[data-ic]{flex:none;width:42px;height:42px;min-height:0;padding:0!important}
#room .row #load,#room .row #snd{flex:none;height:42px;min-height:0;padding:0 16px!important}
/* ---------- chat mengisi sisa layar ---------- */
#room>#chat{flex:1 0 230px!important;height:auto!important;min-height:230px!important}
#msgs{padding:2px 0 8px}
#msgs:empty::before{content:"Belum ada pesan. Sapa temanmu 👋";margin:auto;color:#9aa6c2;font-size:13px;text-align:center}
#chat #rx{display:flex;gap:2px;padding:0 0 8px;margin:0 0 6px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid rgba(255,255,255,.08)}
#chat #rx::-webkit-scrollbar{display:none}
#chat #rx button{flex:1 0 auto!important;min-width:44px;height:36px;min-height:0;padding:0 6px!important;font-size:20px!important;background:none!important;border:0!important;box-shadow:none!important}
#chat #rx button:active{background:rgba(255,255,255,.12)!important}
/* ---------- area video kosong ---------- */
#empty{flex-direction:column;font-size:14px;line-height:1.5}
#empty::before{content:"";width:46px;height:46px;margin-bottom:10px;background:#7fd6ff;opacity:.85;${mask('film')}-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;-webkit-mask-size:contain;mask-size:contain}`;
const st=document.createElement('style');st.id='nbroom';st.textContent=css;document.head.appendChild(st);
const u=$('url');if(u)u.placeholder='Tempel link video';
function tick(){
 const l=$('leave'),s=$('share'),chat=$('chat'),rx=$('rx');
 if(l){if(l.textContent.trim()==='Keluar'){l.dataset.rc='exit';l.setAttribute('aria-label','Keluar')}else delete l.dataset.rc}
 if(s){if(s.textContent.trim()==='Salin link'){s.dataset.rc='link';s.setAttribute('aria-label','Salin link')}else delete s.dataset.rc}
 if(rx&&chat&&rx.parentNode!==chat)chat.insertBefore(rx,chat.firstChild)}
setInterval(tick,500);tick();
})();
