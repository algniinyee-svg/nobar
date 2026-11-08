const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto'), util = require('util');
const { WebSocketServer } = require('ws');
const MAX = 8, PUB = path.join(__dirname, 'public');
const MIME = { '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };

/* ---------- ikon aplikasi ---------- */
const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function icon(s) {
  const w = s * 4 + 1, raw = Buffer.alloc(w * s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const u = x / s, v = y / s; let r = 60 + 80 * u, g = 90 + 60 * v, b = 230 - 40 * u;
    if (u > 0.38 && u < 0.72 && Math.abs(v - 0.5) < (0.72 - u) * 0.647) { r = g = b = 255; }
    const o = y * w + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
  }
  const h = Buffer.alloc(13); h.writeUInt32BE(s, 0); h.writeUInt32BE(s, 4); h[8] = 8; h[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', h), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const ICONS = { '/icon-192.png': icon(192), '/icon-512.png': icon(512) };

/* ---------- statistik & database ---------- */
const stats = { since: Date.now(), rooms: 0, joins: 0, installs: 0, peak: 0 };
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    pool.on('error', () => {});
    pool.query('CREATE TABLE IF NOT EXISTS events (id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ NOT NULL DEFAULT now(), kind TEXT NOT NULL, room TEXT)').catch(e => console.log('db init failed:', e.message));
    pool.query('CREATE TABLE IF NOT EXISTS accounts (id BIGSERIAL PRIMARY KEY, username TEXT NOT NULL, lname TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created TIMESTAMPTZ NOT NULL DEFAULT now())')
      .then(() => pool.query('ALTER TABLE accounts ADD COLUMN IF NOT EXISTS rsalt TEXT, ADD COLUMN IF NOT EXISTS rhash TEXT'))
      .catch(e => console.log('db init failed:', e.message));
    pool.query('CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, lname TEXT NOT NULL, sub TEXT NOT NULL, created TIMESTAMPTZ NOT NULL DEFAULT now())').catch(e => console.log('db init failed:', e.message));
  } catch (e) { console.log('db unavailable:', e.message); pool = null; }
}
const logEv = (kind, room) => { if (pool) pool.query('INSERT INTO events(kind, room) VALUES ($1, $2)', [kind, room || null]).catch(() => {}); };
const adminOK = req => process.env.ADMIN_KEY && req.headers['x-admin-key'] === process.env.ADMIN_KEY;
const onlineNow = () => [...rooms.values()].reduce((a, r) => a + r.members.length, 0);

/* ---------- web push ---------- */
const VAPID_PUB = process.env.VAPID_PUBLIC, VAPID_PRIV = process.env.VAPID_PRIVATE;
let webpush = null;
if (pool && VAPID_PUB && VAPID_PRIV) {
  try { webpush = require('web-push'); webpush.setVapidDetails('https://nobar-d2bd.roarai.app', VAPID_PUB, VAPID_PRIV); }
  catch (e) { console.log('push unavailable:', e.message); webpush = null; }
}
async function pushUser(lname, payload) {
  if (!webpush || !pool) return;
  try {
    const r = await pool.query('SELECT endpoint, sub FROM push_subs WHERE lname = $1', [lname]);
    for (const row of r.rows) {
      webpush.sendNotification(JSON.parse(row.sub), JSON.stringify(payload), { TTL: 120, urgency: 'high' }).catch(err => {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) pool.query('DELETE FROM push_subs WHERE endpoint = $1', [row.endpoint]).catch(() => {});
      });
    }
  } catch {}
}
function pushHidden(r, exceptId, payload, onlyId) {
  if (!webpush) return;
  const now = Date.now();
  r.members.forEach(c => {
    if (c.id === exceptId || (onlyId && c.id !== onlyId) || !c.hidden) return;
    c.pt = c.pt || {};
    if (now - (c.pt[payload.tag] || 0) < 8000) return;
    c.pt[payload.tag] = now;
    pushUser(c.user.toLowerCase(), Object.assign({ url: '/#' + r.code }, payload));
  });
}

/* ---------- akun ---------- */
const SECRET = crypto.createHash('sha256').update('nobar|' + (process.env.SESSION_SECRET || process.env.DATABASE_URL || '')).digest();
const scrypt = util.promisify(crypto.scrypt);
const hashPw = async (pw, salt) => (await scrypt(pw, salt, 32)).toString('hex');
const sign = p => { const body = Buffer.from(JSON.stringify(p)).toString('base64url'); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
function verify(tok) {
  if (typeof tok !== 'string') return null;
  const [body, sig] = tok.split('.'); if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
const RC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => { const b = crypto.randomBytes(12); let s = ''; for (let i = 0; i < 12; i++) s += RC[b[i] % RC.length]; return s.match(/.{4}/g).join('-'); };
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
async function issueRecovery(id) {
  const code = newCode(), rs = crypto.randomBytes(16).toString('hex'), rh = await hashPw(normCode(code), rs);
  await pool.query('UPDATE accounts SET rsalt=$1, rhash=$2 WHERE id=$3', [rs, rh, id]);
  return code;
}
const readJson = req => new Promise(ok => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s)); } catch { ok(null); } }); req.on('error', () => ok(null)); });
const tries = new Map();
const limited = ip => { const n = Date.now(), a = (tries.get(ip) || []).filter(t => n - t < 600000); a.push(n); tries.set(ip, a); return a.length > 15; };
setInterval(() => tries.clear(), 3600000);
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const bearer = req => (req.headers.authorization || '').replace(/^Bearer /, '');

/* ---------- http ---------- */
const server = http.createServer(async (req, res) => {
  let f = req.url.split('?')[0];
  const J = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  if (ICONS[f]) { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=86400' }); return res.end(ICONS[f]); }
  if (f === '/api/installed' && req.method === 'POST') { stats.installs++; logEv('install'); res.writeHead(204); return res.end(); }
  if (f === '/api/me') { const p = verify(bearer(req)); return J(200, { accounts: !!pool, user: p ? p.u : null }); }
  if (f === '/api/vapid') return J(200, { key: webpush ? VAPID_PUB : null });
  if (f === '/api/push/sub' && req.method === 'POST') {
    const p = verify(bearer(req)); if (!p || !pool) return J(401, { error: 'Login dulu.' });
    const b = await readJson(req), s = b && b.sub;
    if (!s || typeof s.endpoint !== 'string' || !/^https:\/\//.test(s.endpoint) || !s.keys) return J(400, { error: 'Data tidak valid.' });
    try { await pool.query('INSERT INTO push_subs(endpoint, lname, sub) VALUES ($1,$2,$3) ON CONFLICT (endpoint) DO UPDATE SET lname = $2, sub = $3', [s.endpoint, p.u.toLowerCase(), JSON.stringify(s)]); return J(200, { ok: true }); }
    catch (e) { return J(500, { error: 'Server error.' }); }
  }
  if (f === '/api/push/unsub' && req.method === 'POST') {
    const p = verify(bearer(req)); if (!p || !pool) return J(401, { error: 'Login dulu.' });
    const b = await readJson(req);
    try { if (b && typeof b.endpoint === 'string') await pool.query('DELETE FROM push_subs WHERE endpoint = $1 AND lname = $2', [b.endpoint, p.u.toLowerCase()]); return J(200, { ok: true }); }
    catch (e) { return J(500, { error: 'Server error.' }); }
  }
  if ((f === '/api/register' || f === '/api/login') && req.method === 'POST') {
    if (!pool) return J(503, { error: 'Akun belum aktif di server ini.' });
    if (limited(ipOf(req))) return J(429, { error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
    const b = await readJson(req), u = String((b && b.username) || '').trim(), p = String((b && b.password) || '');
    if (!/^[A-Za-z0-9_.-]{3,16}$/.test(u)) return J(400, { error: 'Username 3-16 karakter: huruf, angka, _ . -' });
    if (p.length < 6 || p.length > 64) return J(400, { error: 'Password 6-64 karakter.' });
    const exp = Date.now() + 30 * 864e5;
    try {
      if (f === '/api/register') {
        const salt = crypto.randomBytes(16).toString('hex'), h = await hashPw(p, salt);
        const r = await pool.query('INSERT INTO accounts(username, lname, salt, hash) VALUES ($1,$2,$3,$4) ON CONFLICT (lname) DO NOTHING RETURNING id', [u, u.toLowerCase(), salt, h]);
        if (!r.rows.length) return J(409, { error: 'Username sudah dipakai.' });
        logEv('signup');
        const recovery = await issueRecovery(r.rows[0].id);
        return J(200, { token: sign({ id: r.rows[0].id, u, exp }), user: u, recovery });
      }
      const r = await pool.query('SELECT id, username, salt, hash FROM accounts WHERE lname = $1', [u.toLowerCase()]);
      const a = r.rows[0]; let ok = false;
      if (a) ok = crypto.timingSafeEqual(Buffer.from(await hashPw(p, a.salt)), Buffer.from(a.hash));
      if (!ok) return J(401, { error: 'Username atau password salah.' });
      return J(200, { token: sign({ id: a.id, u: a.username, exp }), user: a.username });
    } catch (e) { return J(500, { error: 'Server error.' }); }
  }
  if (f === '/api/recovery' && req.method === 'POST') {
    if (!pool) return J(503, { error: 'Akun belum aktif di server ini.' });
    const p = verify(bearer(req)); if (!p) return J(401, { error: 'Silakan login dulu.' });
    if (limited('r' + ipOf(req))) return J(429, { error: 'Terlalu banyak percobaan.' });
    try { return J(200, { recovery: await issueRecovery(p.id) }); } catch (e) { return J(500, { error: 'Server error.' }); }
  }
  if (f === '/api/reset' && req.method === 'POST') {
    if (!pool) return J(503, { error: 'Akun belum aktif di server ini.' });
    if (limited('r' + ipOf(req))) return J(429, { error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
    const b = await readJson(req), u = String((b && b.username) || '').trim(), c = normCode(b && b.code), p = String((b && b.password) || '');
    if (!/^[A-Za-z0-9_.-]{3,16}$/.test(u) || c.length !== 12) return J(400, { error: 'Username atau kode pemulihan tidak valid.' });
    if (p.length < 6 || p.length > 64) return J(400, { error: 'Password baru 6-64 karakter.' });
    try {
      const r = await pool.query('SELECT id, username, rsalt, rhash FROM accounts WHERE lname = $1', [u.toLowerCase()]);
      const a = r.rows[0]; let ok = false;
      if (a && a.rhash) ok = crypto.timingSafeEqual(Buffer.from(await hashPw(c, a.rsalt)), Buffer.from(a.rhash));
      if (!ok) return J(401, { error: 'Username atau kode pemulihan salah.' });
      const salt = crypto.randomBytes(16).toString('hex'), h = await hashPw(p, salt);
      await pool.query('UPDATE accounts SET salt=$1, hash=$2 WHERE id=$3', [salt, h, a.id]);
      const recovery = await issueRecovery(a.id);
      logEv('reset');
      return J(200, { token: sign({ id: a.id, u: a.username, exp: Date.now() + 30 * 864e5 }), user: a.username, recovery });
    } catch (e) { return J(500, { error: 'Server error.' }); }
  }
  if (f === '/api/admin/accounts') {
    if (!adminOK(req)) { res.writeHead(401); return res.end('Unauthorized'); }
    if (!pool) return J(200, { accounts: [] });
    try {
      const q = (new URL(req.url, 'http://x').searchParams.get('q') || '').toLowerCase().replace(/[%_\\]/g, '');
      const r = await pool.query('SELECT username, created, (rhash IS NOT NULL) AS rec FROM accounts WHERE lname LIKE $1 ORDER BY created DESC LIMIT 200', [q + '%']);
      return J(200, { accounts: r.rows });
    } catch (e) { return J(500, { error: 'query gagal' }); }
  }
  if (f === '/api/admin/reset' && req.method === 'POST') {
    if (!adminOK(req)) { res.writeHead(401); return res.end('Unauthorized'); }
    if (!pool) return J(503, { error: 'Database belum aktif' });
    const b = await readJson(req), u = String((b && b.username) || '').trim().toLowerCase();
    if (!u) return J(400, { error: 'Username kosong' });
    try {
      const temp = newCode().replace(/-/g, '').slice(0, 10), salt = crypto.randomBytes(16).toString('hex'), h = await hashPw(temp, salt);
      const r = await pool.query('UPDATE accounts SET salt=$1, hash=$2 WHERE lname=$3 RETURNING username', [salt, h, u]);
      if (!r.rows.length) return J(404, { error: 'Akun tidak ditemukan' });
      logEv('adminreset');
      return J(200, { user: r.rows[0].username, temp });
    } catch (e) { return J(500, { error: 'Server error' }); }
  }
  if (f === '/api/stats') {
    if (!adminOK(req)) { res.writeHead(401); return res.end('Unauthorized'); }
    return J(200, { ...stats, now: Date.now(), online: onlineNow(), active: [...rooms.values()].map(r => ({ code: r.code, n: r.members.length, locked: !!r.pw, playing: r.playing, video: r.video ? (r.video.type === 'yt' ? 'YouTube' : 'Link') : '-', queue: r.queue.length })) });
  }
  if (f === '/api/history') {
    if (!adminOK(req)) { res.writeHead(401); return res.end('Unauthorized'); }
    if (!pool) return J(200, { db: false });
    try {
      const t = await pool.query('SELECT kind, count(*)::int AS n FROM events GROUP BY kind');
      const d = await pool.query("SELECT ((ts AT TIME ZONE 'Asia/Jakarta')::date)::text AS day, kind, count(*)::int AS n FROM events WHERE ts > now() - interval '7 days' GROUP BY 1, 2 ORDER BY 1 DESC");
      const totals = {}; t.rows.forEach(x => totals[x.kind] = x.n);
      return J(200, { db: true, totals, days: d.rows });
    } catch (e) { return J(200, { db: false, error: 'query gagal' }); }
  }
  if (f === '/') f = '/index.html';
  const p = path.join(PUB, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d);
  });
});

/* ---------- room realtime ---------- */
const wss = new WebSocketServer({ server, maxPayload: 65536 });
const rooms = new Map(); let uid = 0;
const EMO = ['❤️', '😂', '😮', '👏', '🔥', '😢'];
const send = (ws, m) => ws.readyState === 1 && ws.send(JSON.stringify(m));
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const pos = r => r.playing ? r.pos + (Date.now() - r.at) / 1000 : r.pos;
const stateMsg = r => ({ t: 'state', video: r.video, playing: r.playing, pos: pos(r) });
const qmsg = r => ({ t: 'queue', q: r.queue });
const bcast = (r, m) => r.members.forEach(c => send(c.ws, m));
function members(r) {
  bcast(r, { t: 'members', host: r.host, list: [...r.members].map(c => ({ id: c.id, name: c.name })), mode: r.members.length >= 3 ? 'host' : r.members.length === 2 ? 'duo' : 'solo' });
}
function askHost(r) {
  bcast(r, { t: 'joinreq_clear' });
  const h = r.members.find(c => c.id === r.host); if (!h) return;
  r.pending.forEach(p => {
    send(h.ws, { t: 'joinreq', id: p.id, name: p.user });
    pushHidden(r, 0, { title: 'Permintaan masuk', body: p.user + ' ingin masuk lagi', tag: 'jr' }, r.host);
  });
}
function apply(r, a) {
  let qb = false;
  if (a.k === 'load' && a.video) {
    r.video = a.video; r.playing = false; r.pos = 0;
    const s = JSON.stringify(a.video), i = r.queue.findIndex(q => JSON.stringify(q) === s);
    if (i > -1) { r.queue.splice(i, 1); qb = true; }
  }
  else if (a.k === 'play') { r.playing = true; r.pos = +a.pos || 0; }
  else if (a.k === 'pause') { r.playing = false; r.pos = +a.pos || 0; }
  else if (a.k === 'seek') { r.pos = +a.pos || 0; }
  else return;
  r.at = Date.now(); bcast(r, stateMsg(r)); if (qb) bcast(r, qmsg(r));
}
function validVideo(v) {
  if (!v) return null;
  if (v.type === 'yt' && /^[\w-]{11}$/.test(v.id)) return { type: 'yt', id: v.id };
  if (v.type === 'url' && typeof v.url === 'string' && /^https?:\/\//i.test(v.url) && v.url.length < 1000) return { type: 'url', url: v.url };
  return null;
}
wss.on('connection', ws => {
  let r = null, me = null;
  ws.isAlive = true; ws.on('pong', () => ws.isAlive = true);
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'join') {
      if (r) return;
      const code = clean(m.room, 12).toUpperCase(); if (!code) return;
      const pw = clean(m.pw, 20);
      let user;
      if (pool) { const au = verify(m.token); if (!au) return send(ws, { t: 'deny', msg: 'Sesi habis, silakan login lagi.' }); user = au.u; }
      else user = clean(m.name, 16) || 'Tamu';
      let room = rooms.get(code);
      if (room && room.pw && room.pw !== pw) return send(ws, { t: 'deny', msg: 'Password room salah.' });
      if (room && room.banned.has(user.toLowerCase())) {
        const key = user.toLowerCase();
        if (ws.pend) return;
        if ((room.cool.get(key) || 0) > Date.now()) return send(ws, { t: 'deny', msg: 'Host menolak permintaanmu. Coba lagi nanti.' });
        if (room.pending.size >= 5) return send(ws, { t: 'deny', msg: 'Terlalu banyak permintaan masuk.' });
        const id = ++uid; room.pending.set(id, { id, user, ws }); ws.pend = { room, id };
        send(ws, { t: 'wait' }); askHost(room); return;
      }
      if (!room) {
        room = { code, members: [], host: null, video: null, playing: false, pos: 0, at: Date.now(), prop: null, queue: [], pw, banned: new Set(), chat: [], pending: new Map(), cool: new Map() };
        rooms.set(code, room); stats.rooms++; logEv('room', code);
      }
      const dup = pool ? room.members.find(c => c.user === user) : null;
      if (dup) { room.members = room.members.filter(c => c !== dup); if (room.host === dup.id) room.host = null; send(dup.ws, { t: 'replaced' }); dup.ws.close(); }
      if (room.members.length >= MAX) return send(ws, { t: 'deny', msg: 'Room penuh (maks 8 orang).' });
      me = { id: ++uid, name: user, user, ws, hidden: false }; r = room;
      r.members.push(me); if (!r.host) r.host = me.id;
      stats.joins++; stats.peak = Math.max(stats.peak, onlineNow()); logEv('join', code);
      send(ws, { t: 'joined', id: me.id, code, pw: room.pw || '' });
      members(r); if (r.video) send(ws, stateMsg(r));
      if (r.queue.length) send(ws, qmsg(r));
      if (r.chat.length) send(ws, { t: 'history', list: r.chat });
      if (r.prop) send(ws, { t: 'proposal', p: r.prop.pub });
      if (r.host === me.id && r.pending.size) askHost(r);
      pushHidden(r, me.id, { title: 'Nobar', body: '👋 ' + user + ' bergabung', tag: 'join' });
      return;
    }
    if (!r) return;
    if (m.t === 'vis') { me.hidden = !!m.h; return; }
    if (m.t === 'chat') {
      const x = clean(m.text, 300);
      if (x) {
        r.chat.push({ from: me.name, text: x }); if (r.chat.length > 50) r.chat.shift();
        bcast(r, { t: 'chat', from: me.name, id: me.id, text: x });
        pushHidden(r, me.id, { title: '💬 ' + me.name, body: x.slice(0, 100), tag: 'chat' });
      }
      return;
    }
    if (m.t === 'invite') {
      if (!pool || !webpush) return send(ws, { t: 'info', msg: 'Undangan belum aktif di server.' });
      const to = clean(m.to, 16).toLowerCase(); if (!to) return;
      if (Date.now() - (me.inv || 0) < 5000) return send(ws, { t: 'info', msg: 'Tunggu sebentar sebelum mengundang lagi.' });
      me.inv = Date.now();
      pool.query('SELECT 1 FROM accounts WHERE lname = $1', [to]).then(a => {
        if (!a.rows.length) return send(ws, { t: 'info', msg: 'Username tidak ditemukan.' });
        return pool.query('SELECT 1 FROM push_subs WHERE lname = $1 LIMIT 1', [to]).then(s => {
          if (!s.rows.length) return send(ws, { t: 'info', msg: 'Dia belum mengaktifkan notifikasi push.' });
          pushUser(to, { title: '📨 Undangan Nobar', body: me.name + ' mengajakmu ke room ' + r.code + (r.pw ? ' · password: ' + r.pw : ''), tag: 'inv', url: '/#' + r.code });
          send(ws, { t: 'info', msg: 'Undangan terkirim ke ' + to });
        });
      }).catch(() => {});
      return;
    }
    if (m.t === 'sig') { const to = r.members.find(c => c.id === m.to); if (to && m.data) send(to.ws, { t: 'sig', from: me.id, data: m.data }); return; }
    if (m.t === 'mute') { if (r.host === me.id) { const to = r.members.find(c => c.id === m.to); if (to) send(to.ws, { t: 'mute' }); } return; }
    if (m.t === 'joinans') {
      if (r.host !== me.id) return;
      const p = r.pending.get(+m.id); if (!p) return;
      r.pending.delete(p.id); p.ws.pend = null;
      if (m.ok) { r.banned.delete(p.user.toLowerCase()); send(p.ws, { t: 'approved' }); }
      else { r.cool.set(p.user.toLowerCase(), Date.now() + 30000); send(p.ws, { t: 'deny', msg: 'Host menolak permintaanmu.' }); }
      return;
    }
    if (m.t === 'givehost') { if (r.host === me.id) { const to = r.members.find(c => c.id === m.to); if (to && to !== me) { r.host = to.id; members(r); askHost(r); } } return; }
    if (m.t === 'kick') {
      if (r.host === me.id) {
        const to = r.members.find(c => c.id === m.to);
        if (to && to !== me) { r.banned.add(to.user.toLowerCase()); send(to.ws, { t: 'kicked' }); setTimeout(() => to.ws.close(), 300); }
      }
      return;
    }
    if (m.t === 'react') { if (EMO.includes(m.e) && Date.now() - (me.rl || 0) > 300) { me.rl = Date.now(); bcast(r, { t: 'react', e: m.e, id: me.id }); } return; }
    if (m.t === 'qadd') { const v = validVideo(m.video); if (v && r.queue.length < 20 && (r.members.length < 3 || r.host === me.id)) { r.queue.push(v); bcast(r, qmsg(r)); } return; }
    if (m.t === 'qrm') { const i = +m.i; if (Number.isInteger(i) && r.queue[i] && (r.members.length < 3 || r.host === me.id)) { r.queue.splice(i, 1); bcast(r, qmsg(r)); } return; }
    if (m.t === 'qnext') {
      if (r.queue.length && JSON.stringify(r.video) === JSON.stringify(m.cur)) {
        r.video = r.queue.shift(); r.playing = true; r.pos = 0; r.at = Date.now();
        bcast(r, stateMsg(r)); bcast(r, qmsg(r));
      }
      return;
    }
    if (m.t === 'tick') { if (r.host === me.id && r.playing) { r.pos = +m.pos || 0; r.at = Date.now(); bcast(r, stateMsg(r)); } return; }
    if (m.t === 'act') {
      const a = { k: m.k, pos: m.pos, video: m.k === 'load' ? validVideo(m.video) : null };
      if (m.k === 'load' && !a.video) return send(ws, { t: 'err', msg: 'Link tidak valid.' });
      const n = r.members.length;
      if (n >= 3) { if (r.host === me.id) apply(r, a); else send(ws, { t: 'err', msg: 'Hanya host yang bisa mengontrol.' }); return; }
      if (n === 1) return apply(r, a);
      if (r.prop) return send(ws, { t: 'err', msg: 'Masih ada usulan yang menunggu.' });
      const label = { load: 'ganti video', play: 'putar', pause: 'jeda', seek: 'geser video' }[a.k]; if (!label) return;
      r.prop = { by: me.id, a, pub: { by: me.id, name: me.name, label } };
      bcast(r, { t: 'proposal', p: r.prop.pub });
      pushHidden(r, me.id, { title: 'Usulan dari ' + me.name, body: 'ingin ' + label, tag: 'prop' });
      return;
    }
    if (m.t === 'vote' && r.prop && r.prop.by !== me.id) {
      const p = r.prop; r.prop = null;
      bcast(r, { t: 'proposal', p: null, ok: !!m.ok });
      if (m.ok) apply(r, p.a);
    }
  });
  ws.on('close', () => {
    if (ws.pend) { const { room, id } = ws.pend; room.pending.delete(id); ws.pend = null; askHost(room); }
    if (!r || !me) return;
    r.members = r.members.filter(c => c !== me);
    if (!r.members.length) { r.pending.forEach(p => { p.ws.pend = null; send(p.ws, { t: 'approved' }); }); return rooms.delete(r.code); }
    if (r.host === me.id) { r.host = r.members[0].id; askHost(r); }
    if (r.prop && (r.prop.by === me.id || r.members.length !== 2)) { r.prop = null; bcast(r, { t: 'proposal', p: null }); }
    members(r);
  });
});
setInterval(() => wss.clients.forEach(w => { if (!w.isAlive) return w.terminate(); w.isAlive = false; w.ping(); }), 20000);
server.listen(process.env.PORT || 3000, () => console.log('nobar on', process.env.PORT || 3000));
