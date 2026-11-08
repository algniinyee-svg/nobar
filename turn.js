module.exports = (server, getPool, verify, bearer) => {
  const orig = server.listeners('request')[0];
  server.removeAllListeners('request');
  let cache = { at: 0, servers: null };
  const J = (res, c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
  const tidy = s => (Array.isArray(s) ? s : [s]).map(x => Object.assign({}, x, { urls: [].concat(x.urls || []).filter(u => !/:53(\?|$)/.test(u)) })).filter(x => x.urls.length);
  async function getIce() {
    if (cache.servers && Date.now() - cache.at < 6 * 3600e3) return cache.servers;
    let servers = null;
    const app = String(process.env.METERED_APP || '').replace(/^https?:\/\//, '').replace(/\.metered\.live.*$/, '').trim(), key = process.env.METERED_API_KEY;
    if (app && key && /^[a-z0-9-]+$/i.test(app)) {
      const r = await fetch('https://' + app + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(key));
      if (r.ok) servers = tidy(await r.json()); else console.log('metered credentials gagal:', r.status);
    } else if (process.env.TURN_KEY_ID && process.env.TURN_KEY_TOKEN) {
      const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + process.env.TURN_KEY_ID + '/credentials/generate-ice-servers', {
        method: 'POST', headers: { Authorization: 'Bearer ' + process.env.TURN_KEY_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 })
      });
      if (r.ok) { const j = await r.json(); if (j.iceServers) servers = tidy(j.iceServers); } else console.log('cloudflare credentials gagal:', r.status);
    }
    if (servers && servers.length) { cache = { at: Date.now(), servers }; return servers; }
    return null;
  }
  server.on('request', async (req, res) => {
    if (req.url.split('?')[0] !== '/api/ice') return orig(req, res);
    if (getPool() && !verify(bearer(req))) return J(res, 401, { error: 'Login dulu.' });
    try { const s = await getIce(); return J(res, 200, { iceServers: s || [], turn: !!s }); }
    catch (e) { console.log('turn error:', e.message); return J(res, 200, { iceServers: [], turn: false }); }
  });
};
