const crypto = require('crypto');
module.exports = getPool => {
  let sa = null, ok = false, tok = null, tokExp = 0, ini = null;
  try {
    if (process.env.FCM_SERVICE_ACCOUNT) {
      sa = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
      ok = !!(sa.client_email && sa.private_key && sa.project_id);
    }
  } catch (e) { console.log('FCM_SERVICE_ACCOUNT bukan JSON yang valid'); }
  if (ok) console.log('FCM aktif untuk proyek', sa.project_id);
  const init = pool => {
    if (!ini) { ini = pool.query('CREATE TABLE IF NOT EXISTS fcm_dev (token TEXT NOT NULL, lname TEXT NOT NULL, created TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (token, lname))'); ini.catch(() => { ini = null; }); }
    return ini;
  };
  const b64u = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  async function access() {
    if (tok && Date.now() < tokExp - 60000) return tok;
    const now = Math.floor(Date.now() / 1000);
    const head = b64u({ alg: 'RS256', typ: 'JWT' });
    const claim = b64u({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(sa.private_key).toString('base64url');
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + head + '.' + claim + '.' + sig
    });
    const j = await r.json();
    if (!r.ok || !j.access_token) throw new Error('oauth ' + r.status);
    tok = j.access_token; tokExp = Date.now() + (j.expires_in || 3600) * 1000;
    return tok;
  }
  const str = v => v == null ? '' : String(v);
  async function sendTo(token, p) {
    const data = { tag: str(p.tag), url: str(p.url) };
    if (p.inv) { data.room = str(p.inv.room); data.pw = str(p.inv.pw); data.from = str(p.inv.from); }
    const body = { message: { token, notification: { title: str(p.title), body: str(p.body) }, data, android: { priority: 'HIGH', ttl: '120s', notification: { channel_id: 'nobar', tag: str(p.tag) || undefined } } } };
    const r = await fetch('https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send', {
      method: 'POST', headers: { Authorization: 'Bearer ' + await access(), 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (r.ok) return 'ok';
    const t = await r.text();
    console.log('fcm gagal', r.status, t.slice(0, 200));
    if (r.status === 404 || /UNREGISTERED|registration-token-not-registered/.test(t)) return 'dead';
    return 'err ' + r.status;
  }
  async function send(lname, p) {
    if (!ok) return;
    const pool = getPool(); if (!pool) return;
    try {
      await init(pool);
      const r = await pool.query('SELECT token FROM fcm_dev WHERE lname = $1', [lname]);
      for (const row of r.rows) {
        const s = await sendTo(row.token, p).catch(e => { console.log('fcm error:', e.message); return 'err'; });
        if (s === 'dead') pool.query('DELETE FROM fcm_dev WHERE token = $1', [row.token]).catch(() => {});
      }
    } catch (e) {}
  }
  async function test(lname) {
    const out = { devices: 0, ok: 0, errors: [] };
    if (!ok) return out;
    const pool = getPool(); if (!pool) return out;
    await init(pool);
    const r = await pool.query('SELECT token FROM fcm_dev WHERE lname = $1', [lname]);
    out.devices = r.rows.length;
    for (const row of r.rows) {
      const s = await sendTo(row.token, { title: '🔔 Tes Nobar', body: 'Notifikasi aplikasi berfungsi!', tag: 'test', url: '/' }).catch(e => 'err ' + e.message);
      if (s === 'ok') out.ok++;
      else { out.errors.push(String(s)); if (s === 'dead') pool.query('DELETE FROM fcm_dev WHERE token = $1', [row.token]).catch(() => {}); }
    }
    return out;
  }
  async function has(lname) {
    if (!ok) return false;
    const pool = getPool(); if (!pool) return false;
    await init(pool);
    return (await pool.query('SELECT 1 FROM fcm_dev WHERE lname = $1 LIMIT 1', [lname])).rows.length > 0;
  }
  function attach({ server, verify, bearer }) {
    const orig = server.listeners('request')[0];
    server.removeAllListeners('request');
    const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
    const body = req => new Promise(done => { let s = ''; req.on('data', d => { s += d; if (s.length > 8192) req.destroy(); }); req.on('end', () => { try { done(JSON.parse(s)); } catch { done(null); } }); req.on('error', () => done(null)); });
    server.on('request', async (req, res) => {
      const f = req.url.split('?')[0];
      if (f !== '/api/fcm/register' && f !== '/api/fcm/unregister') return orig(req, res);
      const p = verify(bearer(req)), pool = getPool();
      if (!p || !pool) return J(res, 401, { error: 'Login dulu.' });
      if (req.method !== 'POST') return J(res, 405, { error: 'Metode tidak didukung.' });
      const b = await body(req), t = b && typeof b.token === 'string' ? b.token : '';
      if (!/^[\w:.\-]{20,4096}$/.test(t)) return J(res, 400, { error: 'Token tidak valid.' });
      const ln = p.u.toLowerCase();
      try {
        await init(pool);
        if (f === '/api/fcm/register') {
          await pool.query('DELETE FROM fcm_dev WHERE token = $1 AND lname <> $2', [t, ln]);
          await pool.query('INSERT INTO fcm_dev(token, lname) VALUES ($1, $2) ON CONFLICT (token, lname) DO NOTHING', [t, ln]);
          await pool.query('DELETE FROM fcm_dev WHERE lname = $1 AND token NOT IN (SELECT token FROM fcm_dev WHERE lname = $1 ORDER BY created DESC LIMIT 5)', [ln]);
        } else {
          await pool.query('DELETE FROM fcm_dev WHERE token = $1 AND lname = $2', [t, ln]);
        }
        return J(res, 200, { ok: true, active: ok });
      } catch (e) { return J(res, 500, { error: 'Server error.' }); }
    });
  }
  return { ready: () => ok, send, test, has, attach };
};
