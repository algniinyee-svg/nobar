module.exports = ({ wss, rooms, send, verify, getPool, pushUser, canPush, hasDevice }) => {
  const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
  const find = ws => { for (const r of rooms.values()) { const me = r.members.find(c => c.ws === ws); if (me) return { r, me }; } return null; };
  function live(ln) {
    const out = [];
    wss.clients.forEach(w => { if (w.readyState === 1 && w.ib && w.ib.ln === ln) out.push({ ws: w, hidden: w.ib.hidden }); });
    rooms.forEach(r => r.members.forEach(c => { if (!c.guest && c.user.toLowerCase() === ln && c.ws.readyState === 1) out.push({ ws: c.ws, hidden: c.hidden }); }));
    return out;
  }
  wss.on('connection', ws => ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'hello') { const au = verify(m.token); if (au && !String(au.u).startsWith('g:')) ws.ib = { ln: au.u.toLowerCase(), hidden: !!m.h }; return; }
    if (m.t === 'vis' && ws.ib) { ws.ib.hidden = !!m.h; return; }
    if (m.t !== 'invite2') return;
    const f = find(ws); if (!f) return;
    const { r, me } = f;
    if (me.guest) return send(ws, { t: 'info', msg: 'Undangan hanya untuk akun terdaftar.' });
    const pool = getPool(); if (!pool) return send(ws, { t: 'info', msg: 'Undangan belum aktif di server.' });
    const to = clean(m.to, 16).toLowerCase(); if (!to) return;
    if (Date.now() - (me.inv || 0) < 5000) return send(ws, { t: 'info', msg: 'Tunggu sebentar sebelum mengundang lagi.' });
    me.inv = Date.now();
    pool.query('SELECT username FROM accounts WHERE lname = $1', [to]).then(async a => {
      if (!a.rows.length) return send(ws, { t: 'info', msg: 'Username tidak ditemukan.' });
      const payload = { room: r.code, pw: r.pw || '', from: me.name };
      const lv = live(to);
      lv.forEach(x => send(x.ws, Object.assign({ t: 'invite' }, payload)));
      let pushed = false;
      if (!lv.some(x => !x.hidden) && canPush() && await hasDevice(to)) {
        pushUser(to, { title: '📨 Undangan Nobar', body: me.name + ' mengajakmu ke room ' + r.code + (r.pw ? ' 🔒' : ''), tag: 'inv', url: '/#' + r.code, inv: payload });
        pushed = true;
      }
      if (lv.length || pushed) send(ws, { t: 'info', msg: 'Undangan terkirim ke ' + a.rows[0].username });
      else send(ws, { t: 'info', msg: 'Dia sedang tidak online dan belum mengaktifkan notifikasi.' });
    }).catch(() => {});
  }));
};
