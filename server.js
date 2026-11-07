const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { WebSocketServer } = require('ws');
const MAX = 8, PUB = path.join(__dirname, 'public');
const MIME = { '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
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
const server = http.createServer((req, res) => {
  let f = req.url.split('?')[0];
  if (ICONS[f]) { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=86400' }); return res.end(ICONS[f]); }
  if (f === '/') f = '/index.html';
  const p = path.join(PUB, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d);
  });
});
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
      const pw = clean(m.pw, 20);
      let room = rooms.get(code);
      if (room && room.pw && room.pw !== pw) return send(ws, { t: 'deny', msg: 'Password room salah.' });
      if (!room) { room = { code, members: [], host: null, video: null, playing: false, pos: 0, at: Date.now(), prop: null, queue: [], pw }; rooms.set(code, room); }
      if (room.members.length >= MAX) return send(ws, { t: 'deny', msg: 'Room penuh (maks 8 orang).' });
      me = { id: ++uid, name: clean(m.name, 16) || 'Tamu', ws }; r = room;
      r.members.push(me); if (!r.host) r.host = me.id;
      send(ws, { t: 'joined', id: me.id, code });
      members(r); if (r.video) send(ws, stateMsg(r));
      if (r.queue.length) send(ws, qmsg(r));
      if (r.prop) send(ws, { t: 'proposal', p: r.prop.pub });
      return;
    }
    if (!r) return;
    if (m.t === 'chat') { const x = clean(m.text, 300); if (x) bcast(r, { t: 'chat', from: me.name, id: me.id, text: x }); return; }
    if (m.t === 'sig') { const to = r.members.find(c => c.id === m.to); if (to && m.data) send(to.ws, { t: 'sig', from: me.id, data: m.data }); return; }
    if (m.t === 'mute') { if (r.host === me.id) { const to = r.members.find(c => c.id === m.to); if (to) send(to.ws, { t: 'mute' }); } return; }
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
const stats = { since: Date.now(), rooms: 0, joins: 0, installs: 0, peak: 0 };
const seenR = new WeakSet();
const onlineNow = () => [...rooms.values()].reduce((a, r) => a + r.members.length, 0);
wss.on('connection', ws => ws.on('message', raw => {
  try {
    const m = JSON.parse(raw); if (m.t !== 'join') return;
    stats.joins++;
    const room = rooms.get(String(m.room || '').replace(/[<>]/g, '').trim().slice(0, 12).toUpperCase());
    if (room && !seenR.has(room)) { seenR.add(room); stats.rooms++; }
    stats.peak = Math.max(stats.peak, onlineNow());
  } catch {}
}));
const origReq = server.listeners('request')[0];
server.removeAllListeners('request');
server.on('request', (req, res) => {
  const f = req.url.split('?')[0];
  if (f === '/api/installed' && req.method === 'POST') { stats.installs++; res.writeHead(204); return res.end(); }
  if (f === '/api/stats') {
    if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) { res.writeHead(401); return res.end('Unauthorized'); }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ ...stats, now: Date.now(), online: onlineNow(), active: [...rooms.values()].map(r => ({ code: r.code, n: r.members.length, locked: !!r.pw, playing: r.playing, video: r.video ? (r.video.type === 'yt' ? 'YouTube' : 'Link') : '-', queue: r.queue.length })) }));
  }
  origReq(req, res);
});
