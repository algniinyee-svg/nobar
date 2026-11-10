module.exports = ({ server, wss, rooms, send, bcast, apply, getPool, verify, bearer, ipOf }) => {
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  const body = (req, max) => new Promise(ok => {
    let s = '', over = false;
    req.on('data', d => { if (s.length > max) over = true; else s += d; });
    req.on('end', () => { if (over) return ok(null); try { ok(JSON.parse(s)); } catch { ok(null); } });
    req.on('error', () => ok(null));
  });

  /* ---------- terjemahan subtitle ke Indonesia ---------- */
  const cache = new Map(), usage = new Map();
  setInterval(() => usage.clear(), 600000);
  const post = async text => {
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'q=' + encodeURIComponent(text)
    });
    if (!r.ok) throw new Error('status ' + r.status);
    const j = await r.json();
    return (j[0] || []).map(x => x[0] || '').join('');
  };
  async function translate(lines) {
    const key = lines.join('\u0001');
    if (cache.has(key)) return cache.get(key);
    let out = (await post(lines.join('\n'))).split('\n').map(s => s.trim());
    if (out.length !== lines.length) {
      out = [];
      for (let i = 0; i < lines.length; i += 8) out.push(...await Promise.all(lines.slice(i, i + 8).map(l => post(l).then(s => s.replace(/\n/g, ' ').trim()).catch(() => l))));
    }
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    cache.set(key, out);
    return out;
  }
  server.on('request', async (req, res) => {
    if (req.url.split('?')[0] !== '/api/translate') return orig(req, res);
    const p = verify(bearer(req));
    if (!p) return J(res, 401, { error: 'Login dulu.' });
    if (req.method !== 'POST') return J(res, 405, { error: 'Metode tidak didukung.' });
    const k = p.u.toLowerCase(), n = (usage.get(k) || 0) + 1; usage.set(k, n);
    if (n > 120) return J(res, 429, { error: 'Batas terjemahan tercapai. Coba lagi nanti.' });
    const b = await body(req, 30000);
    const lines = b && Array.isArray(b.lines) ? b.lines.slice(0, 40).map(s => String(s).slice(0, 300)) : null;
    if (!lines || !lines.length || lines.join('').length > 5000) return J(res, 400, { error: 'Data tidak valid.' });
    try { return J(res, 200, { lines: await translate(lines) }); }
    catch (e) { console.log('translate gagal:', e.message); return J(res, 502, { error: 'Layanan terjemahan sedang tidak tersedia.' }); }
  });

  /* ---------- tunggu bersama (buffering) & rekap ---------- */
  const find = ws => { for (const r of rooms.values()) { const me = r.members.find(c => c.ws === ws); if (me) return { r, me }; } return null; };
  const canCtl = (r, me) => r.members.length < 3 || r.host === me.id;
  const rec = r => r.rec || (r.rec = { start: Date.now(), watch: 0, videos: [], users: new Set(), msgs: {}, reacts: {}, last: '' });
  const pos = r => r.playing ? r.pos + (Date.now() - r.at) / 1000 : r.pos;

  function startHold(r, who, ms) {
    const h = { stamp: r.at, timer: null };
    r.hold = h;
    h.timer = setTimeout(() => {
      if (r.hold !== h) return;
      release(r, true);
    }, ms);
    bcast(r, { t: 'hold', on: true, who });
  }
  function release(r, force) {
    const h = r.hold; if (!h) return;
    const still = r.members.filter(c => c.buf && Date.now() > (c.noHold || 0));
    if (still.length && !force) return;
    clearTimeout(h.timer); r.hold = null;
    if (force) r.members.forEach(c => { if (c.buf) c.noHold = Date.now() + 60000; });
    bcast(r, { t: 'hold', on: false });
    const stamp = h.stamp;
    setTimeout(() => {
      if (rooms.get(r.code) === r && !r.hold && !r.playing && r.video && !r.cd && r.at === stamp) apply(r, { k: 'play' });
    }, 1000);
  }
  function maybeHold(r) {
    if (r.members.length < 2 || !r.playing || r.cd || r.hold) return;
    const b = r.members.filter(c => c.buf && Date.now() > (c.noHold || 0));
    if (!b.length) return;
    apply(r, { k: 'pause' });
    startHold(r, b.map(c => c.name), 20000);
  }

  wss.on('connection', ws => {
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (!m || typeof m.t !== 'string') return;
      const f = find(ws); if (!f) return;
      const { r, me } = f;
      if (m.t === 'join') { rec(r).users.add(me.user); return; }
      if (m.t === 'chat') { const x = rec(r); x.msgs[me.user] = (x.msgs[me.user] || 0) + 1; return; }
      if (m.t === 'react') { const x = rec(r); x.reacts[me.user] = (x.reacts[me.user] || 0) + 1; return; }
      if (m.t === 'buf') { me.buf = !!m.b; if (me.buf) maybeHold(r); else release(r, false); return; }
      if (m.t === 'holdskip') { if (r.hold && (canCtl(r, me) || me.buf)) release(r, true); return; }
      if (m.t === 'recapreq') {
        const x = rec(r);
        send(ws, { t: 'recap', data: { code: r.code, now: Date.now(), start: x.start, watch: x.watch, videos: x.videos, users: [...x.users], msgs: x.msgs, reacts: x.reacts } });
      }
    });
    ws.on('close', () => rooms.forEach(r => { if (r.hold) release(r, r.members.length < 2); }));
  });

  setInterval(() => rooms.forEach(r => {
    const x = rec(r);
    if (r.playing) x.watch += 5;
    if (r.video) { const k = JSON.stringify(r.video); if (x.last !== k) { x.last = k; x.videos.push(r.video); if (x.videos.length > 30) x.videos.shift(); } }
  }), 5000);
};
