module.exports = (server, getPool, verify, bearer, ipOf, limited) => {
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  let ready = null;
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  const body = (req, max) => new Promise(ok => {
    const c = []; let n = 0, over = false;
    req.on('data', d => { n += d.length; if (n > max) over = true; else c.push(d); });
    req.on('end', () => ok(over ? null : Buffer.concat(c)));
    req.on('error', () => ok(null));
  });
  server.on('request', async (req, res) => {
    if (req.url.split('?')[0] !== '/api/wallpaper') return orig(req, res);
    const pool = getPool(), p = verify(bearer(req));
    if (!pool) return J(res, 503, { error: 'Database belum aktif.' });
    if (!p) return J(res, 401, { error: 'Login dulu.' });
    const ln = p.u.toLowerCase();
    try {
      if (!ready) { ready = pool.query('CREATE TABLE IF NOT EXISTS wallpapers (lname TEXT PRIMARY KEY, data BYTEA NOT NULL, updated TIMESTAMPTZ NOT NULL DEFAULT now())'); ready.catch(() => { ready = null; }); }
      await ready;
      if (req.method === 'GET') {
        const r = await pool.query('SELECT data FROM wallpapers WHERE lname = $1', [ln]);
        if (!r.rows.length) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-cache' });
        return res.end(r.rows[0].data);
      }
      if (req.method === 'POST') {
        if (limited('w' + ipOf(req))) { await body(req, 1); return J(res, 429, { error: 'Terlalu banyak unggahan. Coba lagi nanti.' }); }
        const b = await body(req, 800 * 1024);
        if (!b) return J(res, 413, { error: 'Foto terlalu besar (maks 800 KB).' });
        if (b.length < 1000 || !(b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)) return J(res, 400, { error: 'Foto tidak valid. Gunakan JPEG.' });
        await pool.query('INSERT INTO wallpapers(lname, data) VALUES ($1, $2) ON CONFLICT (lname) DO UPDATE SET data = $2, updated = now()', [ln, b]);
        return J(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        await pool.query('DELETE FROM wallpapers WHERE lname = $1', [ln]);
        return J(res, 200, { ok: true });
      }
      return J(res, 405, { error: 'Metode tidak didukung.' });
    } catch (e) { return J(res, 500, { error: 'Server error.' }); }
  });
};
