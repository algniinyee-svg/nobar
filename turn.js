module.exports = (server, getPool, verify, bearer) => {
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  let cache = { at: 0, servers: null };
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  async function getIce() {
    const id = process.env.TURN_KEY_ID, tok = process.env.TURN_KEY_TOKEN;
    if (!id || !tok) return null;
    if (cache.servers && Date.now() - cache.at < 6 * 3600e3) return cache.servers;
    const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + id + '/credentials/generate-ice-servers', {
      method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 })
    });
    if (!r.ok) { console.log('turn credentials gagal:', r.status); return null; }
    const j = await r.json(); let s = j.iceServers; if (!s) return null; if (!Array.isArray(s)) s = [s];
    s = s.map(x => Object.assign({}, x, { urls: [].concat(x.urls || []).filter(u => !/:53(\?|$)/.test(u)) })).filter(x => x.urls.length);
    cache = { at: Date.now(), servers: s }; return s;
  }
  server.on('request', async (req, res) => {
    if (req.url.split('?')[0] !== '/api/ice') return orig(req, res);
    if (getPool() && !verify(bearer(req))) return J(res, 401, { error: 'Login dulu.' });
    try { const s = await getIce(); return J(res, 200, { iceServers: s || [], turn: !!s }); }
    catch (e) { console.log('turn error:', e.message); return J(res, 200, { iceServers: [], turn: false }); }
  });
};
