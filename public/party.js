(()=>{
const $=id=>document.getElementById(id);
const mk=(t,x,c)=>{const e=document.createElement(t);if(x)e.textContent=x;if(c)e.className=c;return e};
const tx=o=>{try{ws&&ws.readyState===1&&ws.send(JSON.stringify(o))}catch(e){}};
const st=document.createElement('style');st.textContent=`
#stage>#cdn{inset:0;display:none;align-items:center;justify-content:center;font-size:96px;font-weight:800;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.6);background:rgba(0,0,0,.35);z-index:9;pointer-events:none}
#cdn.pop{animation:cdp .9s ease-out}@keyframes cdp{from{transform:scale(1.7);opacity:0}30%{opacity:1}to{transform:scale(1)}}
#pollc{position:fixed;top:calc(env(safe-area-inset-top,0px) + 64px);left:12px;right:12px;max-width:420px;margin:0 auto;z-index:70;display:grid;gap:8px;padding:12px}
#pollc button{text-align:left;padding:9px 14px;border-radius:16px}.ph{display:flex;justify-content:space-between;align-items:center}
#seats{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px 4px 12px}
.seat{position:relative;width:58px;text-align:center}
.seat::after{content:"";position:absolute;left:3px;right:3px;top:26px;height:28px;border-radius:14px 14px 8px 8px;background:linear-gradient(rgba(255,255,255,.24),rgba(255,255,255,.06));z-index:0}
.seat .av{position:relative;z-index:1;width:44px;height:44px;margin:0 auto;border-radius:50%;background:rgba(255,255,255,.18) center/cover no-repeat;border:2px solid rgba(255,255,255,.35);display:grid;place-items:center;font-weight:700}
.seat b{position:relative;z-index:1;display:block;margin-top:6px;font:11px/1.2 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seat.spk .av{box-shadow:0 0 0 2px #7fd6ff,0 0 14px #7fd6ff}
.seat .cr{position:absolute;top:-9px;right:2px;z-index:3;font-size:14px}
.seat .rx{position:absolute;left:50%;top:0;z-index:4;font-size:24px;transform:translateX(-50%);animation:rxp 1.8s ease-out
