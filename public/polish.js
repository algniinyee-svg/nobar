(()=>{
/* Dependensi baru: font Inter dari Google Fonts. Hapus 3 baris ini untuk menghilangkannya. */
const l=document.createElement('link');l.rel='stylesheet';
l.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';document.head.appendChild(l);
const st=document.createElement('style');st.id='nbpolish';st.textContent=`
html,body,input,button,textarea{font-family:Inter,Roboto,"Segoe UI",Arial,sans-serif!important}
h1{font-weight:700!important}
.sub{color:#d6deef!important;text-shadow:0 1px 10px rgba(0,0,0,.65)}
footer{color:#c6d0e6!important;text-shadow:0 1px 8px rgba(0,0,0,.7)}
#ioshint{text-shadow:0 1px 8px rgba(0,0,0,.7)}
#wp::after{background:linear-gradient(rgba(5,7,12,.5),rgba(5,7,12,.74))!important}
#join .glass.card{background:linear-gradient(180deg,rgba(12,16,28,.66),rgba(12,16,28,.5))!important;-webkit-backdrop-filter:blur(16px) saturate(1.1)!important;backdrop-filter:blur(16px) saturate(1.1)!important}
.nbnav{background:linear-gradient(180deg,rgba(14,18,30,.7),rgba(14,18,30,.58))!important;-webkit-backdrop-filter:blur(16px) saturate(1.1)!important;backdrop-filter:blur(16px) saturate(1.1)!important}
.logo.glass{background:rgba(255,255,255,.1)!important;-webkit-backdrop-filter:blur(14px) saturate(1.1)!important;backdrop-filter:blur(14px) saturate(1.1)!important}
.chips span{background:rgba(10,14,24,.5)!important;color:#d6deef!important}
.seat::after{display:none!important}`;
document.head.appendChild(st);
})();
