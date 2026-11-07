const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const MAX = 8, PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let f = req.url.split('?')[0]; if (f === '/') f = '/index.html';
  const p = path.join(PUB, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d);
  });
});
const wss = new WebSocketServer({ server, maxPayload: 65536 });
const rooms = new Map(); let uid = 0;
const send = (ws, m) => ws.readyState === 1 && ws.send(JSON.stringify(m));
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
const pos = r => r.playing ? r.pos + (Date.now() - r.at) / 1000 : r.pos;
const stateMsg = r => ({ t: 'state', video: r.video, playing: r.playing, pos: pos(r) });
const bcast = (r, m) => r.members.forEach(c => send(c.ws, m));
function members(r) {
  bcast(r, { t: 'members', host: r.host, list: [...r.members].map(c => ({ id: c.id, name: c.name })), mode: r.members.length >= 3 ? 'host' : r.members.length === 2 ? 'duo' : 'solo' });
}
function apply(r, a) {
  if (a.k === 'load' && a.video) { r.video = a.video; r.playing = false; r.pos = 0; }
  else if (a.k === 'play') { r.playing = true; r.pos = +a.pos || 0; }
  else if (a.k === 'pause') { r.playing = false; r.pos = +a.pos || 0; }
  else if (a.k === 'seek') { r.pos = +a.pos || 0; }
  else return;
  r.at = Date.now(); bcast(r, stateMsg(r));
}
function validVideo(v) {
  if (!v || typeof v.url !== 'string') return null;
  if (v.type === 'yt' && /^[\w-]{11}$/.test(v.id)) return { type: 'yt', id: v.id };
  if (v.type === 'url' && /^https?:\/\//i.test(v.url) && v.url.length < 1000) return { type: 'url', url: v.url };
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
      let room = rooms.get(code);
      if (!room) { room = { code, members: [], host: null, video: null, playing: false, pos: 0, at: Date.now(), prop: null }; rooms.set(code, room); }
      if (room.members.length >= MAX) return send(ws, { t: 'err', msg: 'Room penuh (maks 8 orang).' });
      me = { id: ++uid, name: clean(m.name, 16) || 'Tamu', ws }; r = room;
      r.members.push(me); if (!r.host) r.host = me.id;
      send(ws, { t: 'joined', id: me.id, code, room: undefined });
      members(r); if (r.video) send(ws, stateMsg(r));
      if (r.prop) send(ws, { t: 'proposal', p: r.prop.pub });
      return;
    }
    if (!r) return;
    if (m.t === 'chat') { const x = clean(m.text, 300); if (x) bcast(r, { t: 'chat', from: me.name, id: me.id, text: x }); return; }
    if (m.t === 'sig') { const to = r.members.find(c => c.id === m.to); if (to && m.data) send(to.ws, { t: 'sig', from: me.id, data: m.data }); return; }
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
      bcast(r, { t: 'proposal', p: r.prop.pub }); return;
    }
    if (m.t === 'vote' && r.prop && r.prop.by !== me.id) {
      const p = r.prop; r.prop = null;
      bcast(r, { t: 'proposal', p: null, ok: !!m.ok });
      if (m.ok) apply(r, p.a);
    }
  });
  ws.on('close', () => {
    if (!r) return;
    r.members = r.members.filter(c => c !== me);
    if (!r.members.length) return rooms.delete(r.code);
    if (r.host === me.id) r.host = r.members[0].id;
    if (r.prop && (r.prop.by === me.id || r.members.length !== 2)) { r.prop = null; bcast(r, { t: 'proposal', p: null }); }
    members(r);
  });
});
setInterval(() => wss.clients.forEach(w => { if (!w.isAlive) return w.terminate(); w.isAlive = false; w.ping(); }), 20000);
server.listen(process.env.PORT || 3000, () => console.log('nobar on', process.env.PORT || 3000));
