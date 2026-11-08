module.exports = ({ server, wss, rooms, send, bcast, apply, getPool, verify, bearer, ipOf, limited }) => {
  /* ---------- avatar (database) ---------- */
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  const body = (req, max) => new Promise(ok => {
    const c = []; let n = 0, over = false;
    req.on('data', d => { n += d.length; if (n > max) over = true; else c.push(d); });
    req.on('end', () => ok(over ? null : Buffer.concat(c)));
    req.on('error', () => ok(null));
  });
  let ready = null;
  server.on('request', async (req, res) => {
    if (req.url.split('?')[0] !== '/api/avatar') return orig(req, res);
    const pool = getPool(), p = verify(bearer(req));
    if (!pool) return J(res, 503, { error: 'Database belum aktif.' });
    if (!p) return J(res, 401, { error: 'Login dulu.' });
    try {
      if (!ready) { ready = pool.query('CREATE TABLE IF NOT EXISTS avatars (lname TEXT PRIMARY KEY, data BYTEA NOT NULL, updated TIMESTAMPTZ NOT NULL DEFAULT now())'); ready.catch(() => { ready = null; }); }
      await ready;
      if (req.method === 'GET') {
        const u = (new URL(req.url, 'http://x').searchParams.get('u') || p.u).toLowerCase().slice(0, 16);
        const r = await pool.query('SELECT data FROM avatars WHERE lname = $1', [u]);
        if (!r.rows.length) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=60' });
        return res.end(r.rows[0].data);
      }
      const ln = p.u.toLowerCase();
      if (req.method === 'POST') {
        if (limited('a' + ipOf(req))) { await body(req, 1); return J(res, 429, { error: 'Terlalu banyak unggahan. Coba lagi nanti.' }); }
        const b = await body(req, 120 * 1024);
        if (!b) return J(res, 413, { error: 'Foto terlalu besar.' });
        if (b.length < 500 || !(b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)) return J(res, 400, { error: 'Foto tidak valid. Gunakan JPEG.' });
        await pool.query('INSERT INTO avatars(lname, data) VALUES ($1, $2) ON CONFLICT (lname) DO UPDATE SET data = $2, updated = now()', [ln, b]);
        return J(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') { await pool.query('DELETE FROM avatars WHERE lname = $1', [ln]); return J(res, 200, { ok: true }); }
      return J(res, 405, { error: 'Metode tidak didukung.' });
    } catch (e) { return J(res, 500, { error: 'Server error.' }); }
  });

  /* ---------- hitung mundur & voting film ---------- */
  const find = ws => { for (const r of rooms.values()) { const m = r.members.find(c => c.ws === ws); if (m) return { r, me: m }; } return null; };
  const canCtl = (r, me) => r.members.length < 3 || r.host === me.id;
  function countdown(r) {
    if (r.cd) return; r.cd = true;
    if (r.playing) apply(r, { k: 'pause', pos: r.pos + (Date.now() - r.at) / 1000 });
    let n = 3; bcast(r, { t: 'cd', n });
    const iv = setInterval(() => {
      n--;
      if (!r.members.length) { clearInterval(iv); r.cd = false; return; }
      if (n > 0) { bcast(r, { t: 'cd', n }); return; }
      clearInterval(iv); r.cd = false; bcast(r, { t: 'cd', n: 0 });
      if (r.video) apply(r, { k: 'play', pos: r.pos });
    }, 1000);
  }
  const counts = p => { const c = p.opts.map(() => 0); p.votes.forEach(i => { if (c[i] !== undefined) c[i]++; }); return c; };
  const pollView = r => r.poll ? { t: 'poll', p: { opts: r.poll.opts, counts: counts(r.poll), left: Math.max(0, r.poll.end - Date.now()) } } : { t: 'poll', p: null };
  function endPoll(r) {
    const p = r.poll; if (!p) return;
    clearTimeout(p.timer); r.poll = null;
    if (!r.members.length) return;
    const c = counts(p), max = Math.max(...c);
    if (max <= 0) { bcast(r, { t: 'poll', p: null, res: 'Tidak ada suara. Voting dibatalkan.' }); return; }
    const win = c.indexOf(max);
    bcast(r, { t: 'poll', p: null, res: 'Pemenang: pilihan ' + (win + 1) + ' (' + max + ' suara)' });
    apply(r, { k: 'load', video: p.opts[win] });
    countdown(r);
  }
  wss.on('connection', ws => {
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (!m || typeof m.t !== 'string') return;
      const f = find(ws); if (!f) return;
      const { r, me } = f;
      if (m.t === 'join') { if (r.poll) send(ws, pollView(r)); return; }
      if (m.t === 'cdstart') {
        if (!canCtl(r, me)) return send(ws, { t: 'err', msg: 'Hanya host yang bisa memulai hitung mundur.' });
        if (!r.video) return send(ws, { t: 'err', msg: 'Belum ada video.' });
        countdown(r); return;
      }
      if (m.t === 'pollstart') {
        if (r.poll) return send(ws, { t: 'err', msg: 'Voting masih berlangsung.' });
        if (r.members.length < 2) return send(ws, { t: 'err', msg: 'Voting butuh minimal 2 orang.' });
        if (r.queue.length < 2) return send(ws, { t: 'err', msg: 'Butuh minimal 2 video di antrean.' });
        const opts = r.queue.slice(0, 5);
        r.poll = { opts, votes: new Map(), end: Date.now() + 30000, timer: setTimeout(() => endPoll(r), 30000) };
        bcast(r, pollView(r)); return;
      }
      if (m.t === 'pollvote') {
        const i = +m.i;
        if (!r.poll || !Number.isInteger(i) || i < 0 || i >= r.poll.opts.length) return;
        r.poll.votes.set(me.id, i); bcast(r, pollView(r));
        if (r.poll.votes.size >= r.members.length) endPoll(r);
        return;
      }
      if (m.t === 'pollcancel') {
        if (!r.poll || !canCtl(r, me)) return;
        clearTimeout(r.poll.timer); r.poll = null; bcast(r, { t: 'poll', p: null, res: 'Voting dibatalkan.' });
      }
    });
    ws.on('close', () => { for (const r of rooms.values()) if (r.poll && r.members.length && r.poll.votes.size >= r.members.length) endPoll(r); });
  });
};
