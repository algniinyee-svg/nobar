module.exports = ({ server, wss, rooms, getPool, verify, bearer, ipOf, limited, pushUser }) => {
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  const readJson = req => new Promise(ok => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s)); } catch { ok(null); } }); req.on('error', () => ok(null)); });
  const jkt = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  let ready = null;
  function init(pool) {
    if (!ready) {
      ready = (async () => {
        await pool.query("CREATE TABLE IF NOT EXISTS schedules (id BIGSERIAL PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, room TEXT NOT NULL, starts TIMESTAMPTZ NOT NULL, invitees TEXT[] NOT NULL DEFAULT '{}', s15 BOOLEAN NOT NULL DEFAULT FALSE, s0 BOOLEAN NOT NULL DEFAULT FALSE, created TIMESTAMPTZ NOT NULL DEFAULT now())");
        await pool.query('CREATE TABLE IF NOT EXISTS user_stats (lname TEXT PRIMARY KEY, minutes INT NOT NULL DEFAULT 0, messages INT NOT NULL DEFAULT 0, reactions INT NOT NULL DEFAULT 0, rooms_joined INT NOT NULL DEFAULT 0, rooms_created INT NOT NULL DEFAULT 0, scheds INT NOT NULL DEFAULT 0, streak INT NOT NULL DEFAULT 0, longest INT NOT NULL DEFAULT 0, last_day DATE)');
      })();
      ready.catch(() => { ready = null; });
    }
    return ready;
  }
  const COLS = ['minutes', 'messages', 'reactions', 'scheds'];
  function inc(user, col, n) {
    const pool = getPool(); if (!pool || !user || !COLS.includes(col)) return;
    init(pool).then(() => pool.query('INSERT INTO user_stats(lname, ' + col + ') VALUES ($1, $2) ON CONFLICT (lname) DO UPDATE SET ' + col + ' = user_stats.' + col + ' + $2', [user.toLowerCase(), n])).catch(() => {});
  }
  function onJoin(me, created) {
    const pool = getPool(); if (!pool) return;
    const u = me.user.toLowerCase(), d = jkt();
    init(pool).then(() => pool.query(
      'INSERT INTO user_stats(lname, rooms_joined, rooms_created, streak, longest, last_day) VALUES ($1, 1, $3, 1, 1, $2::date) ' +
      'ON CONFLICT (lname) DO UPDATE SET rooms_joined = user_stats.rooms_joined + 1, rooms_created = user_stats.rooms_created + $3, ' +
      'streak = CASE WHEN user_stats.last_day = $2::date THEN user_stats.streak WHEN user_stats.last_day = $2::date - 1 THEN user_stats.streak + 1 ELSE 1 END, last_day = $2::date',
      [u, d, created ? 1 : 0]))
      .then(() => pool.query('UPDATE user_stats SET longest = GREATEST(longest, streak) WHERE lname = $1', [u])).catch(() => {});
  }
  const BADGES = [
    { id: 'first', icon: '🎬', name: 'Penonton Baru', desc: 'Nonton minimal 1 menit', ok: s => s.minutes >= 1 },
    { id: 'marathon', icon: '🍿', name: 'Maraton', desc: 'Nonton total 5 jam', ok: s => s.minutes >= 300 },
    { id: 'cinephile', icon: '🎞️', name: 'Sinefil', desc: 'Nonton total 25 jam', ok: s => s.minutes >= 1500 },
    { id: 'chatty', icon: '💬', name: 'Cerewet', desc: 'Kirim 100 pesan', ok: s => s.messages >= 100 },
    { id: 'expressive', icon: '😍', name: 'Ekspresif', desc: 'Kirim 50 reaksi', ok: s => s.reactions >= 50 },
    { id: 'host', icon: '🏠', name: 'Tuan Rumah', desc: 'Buat 5 room', ok: s => s.rooms_created >= 5 },
    { id: 'social', icon: '🤝', name: 'Gaul', desc: 'Masuk 20 room', ok: s => s.rooms_joined >= 20 },
    { id: 'streak3', icon: '🔥', name: 'Api Kecil', desc: 'Streak 3 hari', ok: s => s.longest >= 3 },
    { id: 'streak7', icon: '⚡', name: 'Konsisten', desc: 'Streak 7 hari', ok: s => s.longest >= 7 },
    { id: 'planner', icon: '📅', name: 'Perencana', desc: 'Buat 1 jadwal nobar', ok: s => s.scheds >= 1 }
  ];

  /* ---------- pelacak aktivitas ---------- */
  const find = ws => { for (const r of rooms.values()) { const me = r.members.find(c => c.ws === ws); if (me) return { r, me }; } return null; };
  wss.on('connection', ws => ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || (m.t !== 'join' && m.t !== 'chat' && m.t !== 'react')) return;
    const f = find(ws); if (!f) return;
    const { r, me } = f;
    if (m.t === 'join') { if (!ws._sj) { ws._sj = true; onJoin(me, r.members.length === 1 && r.host === me.id); } return; }
    if (m.t === 'react') { if (typeof m.e === 'string' && m.e.length < 8) inc(me.user, 'reactions', 1); return; }
    const txt = String(m.text || '').replace(/^\u27EA[^|\u27EB]{1,16}\|[^\u27EB]{0,80}\u27EB/, '').trim();
    if (!txt) return;
    inc(me.user, 'messages', 1);
    if (Date.now() - (me.mt || 0) < 3000) return; me.mt = Date.now();
    const names = [...new Set((txt.match(/@([A-Za-z0-9_.-]{3,16})/g) || []).map(s => s.slice(1).toLowerCase()))].slice(0, 3);
    names.forEach(n => {
      if (n === me.user.toLowerCase() || r.members.some(c => c.user.toLowerCase() === n)) return;
      pushUser(n, { title: '🔔 ' + me.name + ' menyebutmu', body: txt.slice(0, 100), tag: 'mention', url: '/#' + r.code });
    });
  }));
  setInterval(() => rooms.forEach(r => { if (r.playing && r.video) r.members.forEach(c => inc(c.user, 'minutes', 1)); }), 60000);

  /* ---------- pengingat jadwal ---------- */
  async function tick() {
    const pool = getPool(); if (!pool) return;
    try {
      await init(pool);
      const now = Date.now();
      const a = await pool.query("UPDATE schedules SET s15 = TRUE WHERE s15 = FALSE AND starts - interval '15 minutes' <= now() AND starts > now() RETURNING owner, title, room, invitees, floor(extract(epoch from starts) * 1000)::float8 AS ts");
      a.rows.forEach(s => { const mins = Math.max(1, Math.round((s.ts - now) / 60000)); [s.owner].concat(s.invitees).forEach(u => pushUser(u, { title: '⏰ Nobar sebentar lagi', body: s.title + ' · mulai ' + mins + ' menit lagi · room ' + s.room, tag: 'sc15-' + s.room, url: '/#' + s.room })); });
      const b = await pool.query("UPDATE schedules SET s0 = TRUE, s15 = TRUE WHERE s0 = FALSE AND starts <= now() AND starts > now() - interval '30 minutes' RETURNING owner, title, room, invitees");
      b.rows.forEach(s => [s.owner].concat(s.invitees).forEach(u => pushUser(u, { title: '🎬 Saatnya nobar!', body: s.title + ' · ketuk untuk masuk ke room ' + s.room, tag: 'sc0-' + s.room, url: '/#' + s.room })));
      await pool.query("DELETE FROM schedules WHERE starts < now() - interval '1 day'");
    } catch (e) {}
  }
  setInterval(tick, 30000);

  /* ---------- API ---------- */
  server.on('request', async (req, res) => {
    const f = req.url.split('?')[0];
    if (f !== '/api/sched' && f !== '/api/mystats' && f !== '/api/leaderboard') return orig(req, res);
    const pool = getPool(), p = verify(bearer(req));
    if (!pool) return J(res, 503, { error: 'Database belum aktif.' });
    if (!p) return J(res, 401, { error: 'Login dulu.' });
    const ln = p.u.toLowerCase();
    try {
      await init(pool);
      if (f === '/api/leaderboard') {
        const r = await pool.query('SELECT a.username, s.minutes FROM user_stats s JOIN accounts a ON a.lname = s.lname WHERE s.minutes > 0 ORDER BY s.minutes DESC, a.username LIMIT 10');
        return J(res, 200, { top: r.rows });
      }
      if (f === '/api/mystats') {
        const r = await pool.query('SELECT minutes, messages, reactions, rooms_joined, rooms_created, scheds, streak, longest, last_day::text AS last_day FROM user_stats WHERE lname = $1', [ln]);
        const s = r.rows[0] || { minutes: 0, messages: 0, reactions: 0, rooms_joined: 0, rooms_created: 0, scheds: 0, streak: 0, longest: 0, last_day: null };
        const t = jkt(), y = new Date(Date.parse(t + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
        const cur = s.last_day === t || s.last_day === y ? s.streak : 0;
        let rank = null;
        if (s.minutes > 0) rank = (await pool.query('SELECT count(*)::int + 1 AS n FROM user_stats WHERE minutes > $1', [s.minutes])).rows[0].n;
        return J(res, 200, { minutes: s.minutes, messages: s.messages, reactions: s.reactions, joined: s.rooms_joined, created: s.rooms_created, streak: cur, longest: s.longest, rank, badges: BADGES.map(b => ({ id: b.id, icon: b.icon, name: b.name, desc: b.desc, got: b.ok(s) })) });
      }
      if (req.method === 'GET') {
        const r = await pool.query("SELECT id, owner, title, room, invitees, floor(extract(epoch from starts) * 1000)::float8 AS ts FROM schedules WHERE starts > now() - interval '2 hours' AND (owner = $1 OR $1 = ANY(invitees)) ORDER BY starts LIMIT 30", [ln]);
        return J(res, 200, { items: r.rows.map(x => ({ id: x.id, title: x.title, room: x.room, ts: x.ts, owner: x.owner, mine: x.owner === ln, invitees: x.invitees })) });
      }
      if (req.method === 'POST') {
        if (limited('s' + ipOf(req))) return J(res, 429, { error: 'Terlalu banyak percobaan.' });
        const b = await readJson(req); if (!b) return J(res, 400, { error: 'Data tidak valid.' });
        const title = String(b.title || '').replace(/[<>]/g, '').trim().slice(0, 40) || 'Nobar';
        const room = String(b.room || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12);
        const at = Number(b.at);
        if (!room) return J(res, 400, { error: 'Isi kode room.' });
        if (!Number.isFinite(at) || at < Date.now() + 60000 || at > Date.now() + 60 * 864e5) return J(res, 400, { error: 'Waktu harus di masa depan (maksimal 60 hari).' });
        const want = [...new Set((Array.isArray(b.invitees) ? b.invitees : []).map(x => String(x).trim().toLowerCase()).filter(x => /^[a-z0-9_.-]{3,16}$/.test(x) && x !== ln))].slice(0, 7);
        const cnt = await pool.query('SELECT count(*)::int AS n FROM schedules WHERE owner = $1 AND starts > now()', [ln]);
        if (cnt.rows[0].n >= 10) return J(res, 400, { error: 'Maksimal 10 jadwal aktif.' });
        const ex = want.length ? await pool.query('SELECT lname FROM accounts WHERE lname = ANY($1)', [want]) : { rows: [] };
        const okU = ex.rows.map(x => x.lname), unknown = want.filter(x => !okU.includes(x));
        const ins = await pool.query('INSERT INTO schedules(owner, title, room, starts, invitees) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5) RETURNING id', [ln, title, room, at, okU]);
        let when = ''; try { when = new Date(at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB'; } catch {}
        okU.forEach(u => pushUser(u, { title: '📅 Undangan nobar', body: p.u + ' mengajak: ' + title + ' · ' + when + ' · room ' + room, tag: 'sc-inv', url: '/#' + room }));
        inc(ln, 'scheds', 1);
        return J(res, 200, { ok: true, id: ins.rows[0].id, unknown });
      }
      if (req.method === 'DELETE') {
        const id = parseInt(new URL(req.url, 'http://x').searchParams.get('id'), 10);
        if (Number.isInteger(id)) await pool.query('DELETE FROM schedules WHERE id = $1 AND owner = $2', [id, ln]);
        return J(res, 200, { ok: true });
      }
      return J(res, 405, { error: 'Metode tidak didukung.' });
    } catch (e) { console.log('social error:', e.message); return J(res, 500, { error: 'Server error.' }); }
  });
};
