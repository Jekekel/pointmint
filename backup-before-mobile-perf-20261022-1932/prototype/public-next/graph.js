/* PointMint knowledge graph: the full-bleed, always-live background of the app.
   Custom force layout + Canvas2D, bundled locally (no CDN, strict CSP). ~350 nodes at 60 fps.
   Humans: round, warm, real photo + Digital Twin ring. Agents: rounded square, cool, sunglasses avatar.
   Each human is tethered to its one agent (yin-yang at the midpoint). Vault intents and posts are satellites. */
(function () {
  'use strict';
  const C = { human: '#ffb47a', agent: '#93a9ff', mint: '#3dd9c1', path: '#ffe58a', reserved: '#e8ecf4',
    company: '#9fd3ff', school: '#d7b8ff', investor: '#7ee0b0', industry: '#a8b3c7', event: '#ffc38a', deal: '#ff9fb2', skill: '#b9e27c', buy: '#7fd8a6', sell: '#f2c46d', seek: '#8cc8ff', acquire: '#c7a6ff' };
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const imgCache = new Map();
  function img(url) {
    if (!url) return null;
    let im = imgCache.get(url); if (im) return im;
    im = new Image(); im.decoding = 'async'; im.src = url; imgCache.set(url, im); return im;
  }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

  const G = {
    nodes: [], edges: [], byId: new Map(), adj: new Map(), hidden: new Set(), cam: { x: 0, y: 0, k: 1 }, alpha: 1,
    hover: null, sel: null, focusIdx: -1, path: null, pulses: [], ripples: [], onSelect: null, onEdge: null, onFocusText: null, t0: performance.now(), ready: false,
  };
  let cv, ctx, W = 0, H = 0, DPR = 1, raf = 0, running = false;

  // ---------- data ----------
  function load(data) {
    const old = G.byId;
    G.nodes = data.nodes.map(n => {
      const o = old.get(n.id);
      const r = n.type === 'human' ? 13 : n.type === 'agent' ? 11 : n.type === 'reserved' ? 9.5 : n.type === 'entity' ? (n.kind === 'industry' ? 7 : 5.2) : n.type === 'intent' ? 4 : 3.4;
      return Object.assign({ x: o ? o.x : 0, y: o ? o.y : 0, vx: 0, vy: 0, r, deg: 0, ph: hash(n.id) * Math.PI * 2, placed: !!o }, n);
    });
    G.byId = new Map(G.nodes.map(n => [n.id, n]));
    G.edges = data.edges.filter(e => G.byId.has(e.source) && G.byId.has(e.target)).map(e => Object.assign({}, e, { s: G.byId.get(e.source), t: G.byId.get(e.target), bend: (hash(e.id) - 0.5) * 0.5 }));
    G.adj = new Map(G.nodes.map(n => [n.id, new Set()]));
    for (const e of G.edges) { G.adj.get(e.source).add(e.target); G.adj.get(e.target).add(e.source); e.s.deg++; e.t.deg++; }
    // humans grow a little with their connections
    for (const n of G.nodes) if (n.type === 'human') n.r = 12 + Math.min(6, n.deg * 0.4);
    // initial placement: humans on a phyllotaxis disk, their agent to the right, satellites around
    const hs = G.nodes.filter(n => n.type === 'human');
    hs.forEach((n, i) => { if (n.placed) return; const a = i * 2.39996, rad = 34 * Math.sqrt(i + 1); n.x = Math.cos(a) * rad * 1.25; n.y = Math.sin(a) * rad; });
    // reserved profiles and shared entities: next to something they connect to, else on an outer ring
    for (const n of G.nodes) {
      if (n.placed || (n.type !== 'reserved' && n.type !== 'entity')) continue;
      const nb = [...(G.adj.get(n.id) || [])].map(id => G.byId.get(id)).filter(o => o.type === 'human' || o.placed);
      const a = n.ph, R = 420 + hash(n.id + 'r') * 160;
      if (nb.length) { const o = nb[0]; n.x = o.x + Math.cos(a) * 60; n.y = o.y + Math.sin(a) * 60; } else { n.x = Math.cos(a) * R * 1.3; n.y = Math.sin(a) * R; }
      n.placed = true;
    }
    for (const n of G.nodes) {
      if (n.placed || n.type === 'human') continue;
      const h = G.byId.get(n.human_id) || hs[0] || { x: 0, y: 0 };
      const a = n.ph, d = n.type === 'agent' ? 0 : 30;
      n.x = h.x + (n.type === 'agent' ? 46 : Math.cos(a) * d); n.y = h.y + (n.type === 'agent' ? 6 : Math.sin(a) * d);
    }
    for (const n of G.nodes) { if (n.photo_url) n.im = img(n.photo_url); else if (n.type === 'human') n.im = img('/glass/human-placeholder.svg'); if (n.avatar_url) n.im = img(n.avatar_url); }
    G.alpha = G.ready ? Math.max(G.alpha, 0.35) : 1;
    if (RM.matches || !G.ready) { for (let i = 0; i < (RM.matches ? 320 : 160); i++) tick(); }
    if (!G.ready) fit(false);
    G.ready = true;
  }

  // ---------- physics ----------
  const SPRING = { affil: [80, 0.035], tether: [44, 0.6], intent: [30, 0.35], post: [34, 0.25], together: [30, 0.3], intro: [120, 0.05], match: [150, 0.02], message: [170, 0.012] };
  const CHARGE = { human: 520, agent: 380, intent: 40, post: 34, reserved: 360, entity: 160 };
  function tick() {
    const N = G.nodes, a = G.alpha;
    // repulsion (n² with a cutoff; fine for a few hundred nodes)
    for (let i = 0; i < N.length; i++) {
      const p = N[i]; const cp = CHARGE[p.type] || 60;
      for (let j = i + 1; j < N.length; j++) {
        const q = N[j]; let dx = q.x - p.x, dy = q.y - p.y; let d2 = dx * dx + dy * dy;
        if (d2 > 90000) continue; if (d2 < 1) { dx = (hash(p.id + q.id) - 0.5); dy = 0.5; d2 = 1; }
        const f = a * Math.sqrt(cp * (CHARGE[q.type] || 60)) / d2;
        const fx = dx * f, fy = dy * f; p.vx -= fx; p.vy -= fy; q.vx += fx; q.vy += fy;
      }
    }
    for (const e of G.edges) {
      const sp = SPRING[e.type]; if (!sp) continue;
      const s = e.s, t = e.t; let dx = t.x - s.x, dy = t.y - s.y; const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const k = (d - sp[0]) / d * sp[1] * a * (e.type === 'intro' && e.status === 'accepted' ? 1.6 : e.type === 'affil' && e.rel === 'in_industry' ? 0.35 : 1);
      dx *= k; dy *= k; s.vx += dx * 0.5; s.vy += dy * 0.5; t.vx -= dx * 0.5; t.vy -= dy * 0.5;
      // human on the left, its agent on the right: the warm/cool pair keeps its orientation
      if (e.type === 'tether') { const lean = ((t.x - s.x) - 40) * 0.08 * a; s.vx += lean; t.vx -= lean; }
    }
    for (const n of N) {
      n.vx -= n.x * 0.004 * a; n.vy -= n.y * 0.006 * a;               // gentle gravity (wider than tall)
      if (n.type === 'agent') n.vx += 0.25 * a; if (n.type === 'human') n.vx -= 0.25 * a; // left-warm / right-cool lean
      if (n.fixed) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; continue; }
      n.vx *= 0.6; n.vy *= 0.6; n.x += n.vx; n.y += n.vy;
    }
    G.alpha = Math.max(RM.matches ? 0 : 0.012, G.alpha * 0.985);
  }

  // ---------- camera ----------
  const toScreen = (x, y) => [(x - G.cam.x) * G.cam.k + W / 2, (y - G.cam.y) * G.cam.k + H / 2];
  const toWorld = (sx, sy) => [(sx - W / 2) / G.cam.k + G.cam.x, (sy - H / 2) / G.cam.k + G.cam.y];
  function bounds(list) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const n of list) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); } return { x0, y0, x1, y1 }; }
  let camAnim = null;
  function animateCam(to, ms = 700) {
    if (RM.matches) { Object.assign(G.cam, to); return; }
    const from = Object.assign({}, G.cam), t0 = performance.now();
    camAnim = t => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 4); G.cam.x = from.x + (to.x - from.x) * e; G.cam.y = from.y + (to.y - from.y) * e; G.cam.k = from.k + (to.k - from.k) * e; if (p >= 1) camAnim = null; };
  }
  function fit(anim = true) {
    if (!G.nodes.length || !W) return;
    const b = bounds(G.nodes.filter(n => n.type === 'human' || n.type === 'agent'));
    const k = Math.min(2, 1.0 * Math.min(W / (b.x1 - b.x0 + 80), (H - 60) / (b.y1 - b.y0 + 80)));
    const to = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, k };
    anim ? animateCam(to) : Object.assign(G.cam, to);
  }
  function fly(id, k = 1.7) {
    const n = G.byId.get(id); if (!n) return false;
    // land the node in the most visible part of the screen (between the columns on wide screens)
    const off = typeof G.viewOffset === 'function' ? G.viewOffset() : { x: 0, y: 0 };
    animateCam({ x: n.x - off.x / k, y: n.y - off.y / k, k }, 800);
    G.sel = id; ripple(id, 1.4); return true;
  }

  // ---------- pulses (live activity) ----------
  function edgeBetween(a, b) { return G.edges.find(e => (e.source === a && e.target === b) || (e.source === b && e.target === a)); }
  function pulse(fromId, toId, color) {
    const s = G.byId.get(fromId); if (!s) return;
    const t = toId && G.byId.get(toId);
    if (!t) { ripple(fromId); const n = G.nodes.find(x => x.type === 'agent' && x.human_id === fromId) || (s.human_id && G.byId.get(s.human_id)); if (n) pulse(fromId, n.id, color); return; }
    const e = edgeBetween(fromId, toId);
    G.pulses.push({ s, t, e, rev: e ? e.source !== fromId : false, t0: performance.now(), dur: 1100 + Math.random() * 500, color: color || (s.type === 'agent' ? C.agent : C.human) });
    if (G.pulses.length > 60) G.pulses.shift();
  }
  function ripple(id, big = 1) { const n = G.byId.get(id); if (n) G.ripples.push({ n, t0: performance.now(), big }); if (G.ripples.length > 40) G.ripples.shift(); }

  // ---------- drawing ----------
  let glowSprite = {};
  function sprite(color) {
    if (glowSprite[color]) return glowSprite[color];
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, rgba(color, 0.55)); gr.addColorStop(0.35, rgba(color, 0.16)); gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return (glowSprite[color] = c);
  }
  function visibleNode(n) {
    const H_ = G.hidden;
    if (n.type === 'human' && H_.has('humans')) return false; if (n.type === 'agent' && H_.has('agents')) return false;
    if (n.type === 'intent' && H_.has('intents')) return false; if (n.type === 'post' && H_.has('posts')) return false;
    if (n.type === 'entity' && H_.has('entities') && !(G.path && G.path.set.has(n.id))) return false; if (n.type === 'reserved' && H_.has('public') && !(G.path && G.path.set.has(n.id))) return false; return true;
  }
  function visibleEdge(e) {
    const H_ = G.hidden; if (!visibleNode(e.s) || !visibleNode(e.t)) return false;
    if (e.type === 'intro' && H_.has('intros')) return false; if (e.type === 'match' && H_.has('matches')) return false;
    if (e.type === 'message' && H_.has('messages')) return false; return true;
  }
  function pos(n, t) { if (RM.matches || n.fixed) return [n.x, n.y]; const w = n.type === 'human' || n.type === 'agent' ? 1.6 : 2.4; return [n.x + Math.sin(t * 0.00045 + n.ph) * w, n.y + Math.cos(t * 0.00038 + n.ph * 1.3) * w]; }
  function ctrl(sx, sy, tx, ty, bend) { const mx = (sx + tx) / 2, my = (sy + ty) / 2; return [mx - (ty - sy) * bend, my + (tx - sx) * bend]; }
  function yinyang(x, y, r) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5); ctx.fillStyle = C.human; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); ctx.fillStyle = C.agent; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2); ctx.fillStyle = C.agent; ctx.fill();
    ctx.beginPath(); ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2); ctx.fillStyle = C.human; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -r / 2, r / 6, 0, Math.PI * 2); ctx.fillStyle = C.human; ctx.fill();
    ctx.beginPath(); ctx.arc(0, r / 2, r / 6, 0, Math.PI * 2); ctx.fillStyle = C.agent; ctx.fill();
    ctx.restore();
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function draw(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // ground: near-black with a warm left / cool right wash
    ctx.fillStyle = '#05070b'; ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W * 0.12, H * 0.55, 0, W * 0.12, H * 0.55, W * 0.6); g.addColorStop(0, 'rgba(255,180,122,0.075)'); g.addColorStop(1, 'rgba(255,180,122,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.88, H * 0.45, 0, W * 0.88, H * 0.45, W * 0.6); g.addColorStop(0, 'rgba(147,169,255,0.085)'); g.addColorStop(1, 'rgba(147,169,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const k = G.cam.k, PT = G.path, focus = PT ? null : (G.hover || G.sel), nb = focus ? G.adj.get(focus) : null;
    const lit = n => PT ? PT.set.has(n.id) || n.id === G.hover : (!focus || n.id === focus || (nb && nb.has(n.id)));
    const P = new Map(); for (const n of G.nodes) { const [wx, wy] = pos(n, t); const [sx, sy] = toScreen(wx, wy); P.set(n, [sx, sy]); }
    const on = (x, y, m = 40) => x > -m && y > -m && x < W + m && y < H + m;
    // edges
    ctx.lineCap = 'round';
    for (const e of G.edges) {
      if (!visibleEdge(e)) continue;
      const [sx, sy] = P.get(e.s), [tx, ty] = P.get(e.t);
      if (!on(sx, sy, 400) && !on(tx, ty, 400)) continue;
      const hot = focus && (e.source === focus || e.target === focus);
      const dim = PT ? 0.1 : focus && !hot ? 0.18 : 1;
      let col, w = 1, dash = null;
      switch (e.type) {
        case 'tether': col = null; w = 2.2; break;
        case 'intro': col = e.status === 'accepted' ? 'rgba(61,217,193,0.75)' : e.status === 'declined' || e.status === 'rejected_by_sender' ? 'rgba(255,255,255,0.12)' : 'rgba(61,217,193,0.32)'; w = e.status === 'accepted' ? 1.8 : 1.2; break;
        case 'match': col = 'rgba(255,255,255,0.22)'; dash = [3, 4]; w = 0.9; break;
        case 'message': col = 'rgba(200,210,255,0.11)'; w = 0.8 + Math.min(1.4, (e.count || 1) * 0.2); break;
        case 'together': col = null; w = 1.2; break;
        case 'affil': col = e.provenance === 'public_source' ? 'rgba(232,236,244,0.16)' : 'rgba(170,190,255,0.12)'; dash = e.provenance === 'public_source' ? [1.5, 3.5] : null; w = 0.7; break;
        default: col = 'rgba(255,255,255,0.10)'; w = 0.8;
      }
      ctx.globalAlpha = dim * (hot ? 1 : 0.9);
      const [cx, cy] = ctrl(sx, sy, tx, ty, e.type === 'tether' || e.type === 'intent' || e.type === 'post' ? 0.05 : e.bend);
      if (!col) { const gr = ctx.createLinearGradient(sx, sy, tx, ty); gr.addColorStop(0, rgba(C.human, e.type === 'tether' ? 0.9 : 0.5)); gr.addColorStop(1, rgba(C.agent, e.type === 'tether' ? 0.9 : 0.5)); col = gr; }
      ctx.strokeStyle = col; ctx.lineWidth = w * (hot ? 1.5 : 1) * Math.min(1.4, Math.max(0.7, k));
      ctx.setLineDash(dash ? dash.map(x => x * Math.max(0.8, k)) : []);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
      if (e.type === 'tether' && k > 0.45) { ctx.setLineDash([]); yinyang(0.25 * sx + 0.5 * cx + 0.25 * tx, 0.25 * sy + 0.5 * cy + 0.25 * ty, Math.max(2.4, 3.2 * Math.min(1.6, k))); }
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // the connection path: segments light up one after another, then a spark keeps travelling along it
    if (PT && PT.ids.length > 1) {
      const segs = []; for (let i = 0; i + 1 < PT.ids.length; i++) { const a = G.byId.get(PT.ids[i]), b = G.byId.get(PT.ids[i + 1]); if (a && b) segs.push([a, b]); }
      const el = RM.matches ? 1e9 : t - PT.t0, per = 420;
      ctx.lineCap = 'round';
      segs.forEach(([a, b], i) => {
        const u = Math.max(0, Math.min(1, (el - i * per) / per)); if (u <= 0) return;
        const [ax, ay] = P.get(a), [bx, by] = P.get(b), [cx, cy] = ctrl(ax, ay, bx, by, 0.12);
        const N = 18, m = Math.max(1, Math.round(N * u));
        for (const [w, al] of [[9, 0.12], [4.5, 0.35], [2, 1]]) {
          ctx.strokeStyle = rgba(C.path, al); ctx.lineWidth = w * Math.min(1.4, Math.max(0.8, k)); ctx.beginPath(); ctx.moveTo(ax, ay);
          for (let j = 1; j <= m; j++) { const q = j / N; ctx.lineTo((1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx + q * q * bx, (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy + q * q * by); }
          ctx.stroke();
        }
      });
      if (!RM.matches && el > segs.length * per && segs.length && segs.every(([a, b]) => P.has(a) && P.has(b))) {
        const total = segs.length, f = ((el - total * per) / (900 * total)) % 1, i = Math.min(total - 1, Math.floor(f * total)), q = f * total - i;
        const [a, b] = segs[i], [ax, ay] = P.get(a), [bx, by] = P.get(b), [cx, cy] = ctrl(ax, ay, bx, by, 0.12);
        const x = (1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx + q * q * bx, y = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy + q * q * by, z = 34;
        ctx.drawImage(sprite(C.path), x - z / 2, y - z / 2, z, z); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // pulses travelling along edges
    const now = t;
    G.pulses = G.pulses.filter(p => now - p.t0 < p.dur && P.has(p.e ? p.e.s : p.s) && P.has(p.e ? p.e.t : p.t)); // drop pulses whose nodes left the graph (e.g. a claimed reserved node)
    for (const p of G.pulses) {
      const u = (now - p.t0) / p.dur;
      const [ax, ay] = P.get(p.e ? p.e.s : p.s), [bx, by] = P.get(p.e ? p.e.t : p.t);
      const bend = p.e ? (p.e.type === 'tether' || p.e.type === 'intent' || p.e.type === 'post' ? 0.05 : p.e.bend) : 0.1;
      const [cx, cy] = ctrl(ax, ay, bx, by, bend), q = p.rev ? 1 - u : u;
      const x = (1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx + q * q * bx, y = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy + q * q * by;
      const s = sprite(p.color); const z = 26 * Math.min(1.3, Math.max(0.7, k));
      ctx.globalAlpha = Math.sin(u * Math.PI); ctx.drawImage(s, x - z / 2, y - z / 2, z, z);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    // nodes: satellites first, then agents and humans on top
    const order = ['entity', 'intent', 'post', 'reserved', 'agent', 'human'];
    for (const type of order) for (const n of G.nodes) {
      if (n.type !== type || !visibleNode(n)) continue;
      const [x, y] = P.get(n); if (!on(x, y)) continue;
      const r = n.r * Math.min(1.8, Math.max(0.85, Math.sqrt(k))), L = lit(n);
      ctx.globalAlpha = L ? 1 : 0.16;
      if (type === 'entity') {
        const col = C[n.kind] || '#aab';
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const an = Math.PI / 6 + i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * r, y + Math.sin(an) * r); } ctx.closePath();
        ctx.fillStyle = 'rgba(8,11,18,0.9)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = n.kind === 'industry' ? 1.6 : 1.2; ctx.stroke();
        if (PT && PT.set.has(n.id)) { ctx.drawImage(sprite(C.path), x - r * 3, y - r * 3, r * 6, r * 6); }
        continue;
      }
      if (type === 'reserved') {
        // unclaimed public-figure profile: hollow, dashed outline, initials, no photo or likeness
        ctx.fillStyle = 'rgba(5,7,11,0.85)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.setLineDash([2.5, 2.5]); ctx.strokeStyle = n.status === 'claim_review' ? C.path : rgba(C.reserved, 0.85); ctx.lineWidth = 1.4; ctx.stroke(); ctx.setLineDash([]);
        if (r > 7) { ctx.fillStyle = rgba(C.reserved, 0.9); ctx.font = `600 ${Math.round(r * 0.8)}px -apple-system, BlinkMacSystemFont, Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.initials || '', x, y + 0.5); }
        if (PT && PT.set.has(n.id)) { ctx.strokeStyle = C.path; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.stroke(); }
        if (n.id === G.sel || n.id === G.kbd) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 1.75, 0, Math.PI * 2); ctx.stroke(); }
        continue;
      }
      if (type === 'intent') { ctx.fillStyle = C[n.intent] || '#ccc'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); if (n.author === 'agent') { ctx.strokeStyle = rgba(C.agent, 0.9); ctx.lineWidth = 1; ctx.stroke(); } continue; }
      if (type === 'post') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
        if (n.author === 'both') { ctx.fillStyle = C.human; ctx.fillRect(-r, -r, r, 2 * r); ctx.fillStyle = C.agent; ctx.fillRect(0, -r, r, 2 * r); }
        else { ctx.fillStyle = n.author === 'agent' ? C.agent : C.human; ctx.fillRect(-r, -r, 2 * r, 2 * r); }
        ctx.restore(); if (n.media) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, r + 2.2, 0, Math.PI * 2); ctx.stroke(); }
        continue;
      }
      const col = type === 'human' ? C.human : C.agent;
      const gz = r * (n.id === focus ? 7 : 4.6); ctx.drawImage(sprite(col), x - gz / 2, y - gz / 2, gz, gz);
      ctx.save();
      if (type === 'human') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); }
      else rr(x - r, y - r, 2 * r, 2 * r, r * 0.42);
      ctx.fillStyle = type === 'human' ? '#2a1d14' : '#0a1236'; ctx.fill(); ctx.clip();
      if (n.im && n.im.complete && n.im.naturalWidth) ctx.drawImage(n.im, x - r, y - r, 2 * r, 2 * r);
      ctx.restore();
      ctx.lineWidth = Math.max(1, r * 0.13); ctx.strokeStyle = col;
      if (type === 'human') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
      else { rr(x - r, y - r, 2 * r, 2 * r, r * 0.42); ctx.stroke(); }
      // Digital Twin Score ring around the human
      if (type === 'human' && n.twin != null) {
        const R = r + Math.max(2.5, r * 0.28), a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * n.twin / 100;
        ctx.lineWidth = Math.max(1.2, r * 0.14); ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
        const gr = ctx.createLinearGradient(x - R, y, x + R, y); gr.addColorStop(0, C.human); gr.addColorStop(1, C.agent);
        ctx.strokeStyle = gr; ctx.beginPath(); ctx.arc(x, y, R, a0, a1); ctx.stroke();
      }
      if (n.you) { ctx.strokeStyle = C.mint; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(x, y, r + r * 0.7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      if (n.id === G.sel || n.id === G.kbd) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r * 1.75, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // ripples
    G.ripples = G.ripples.filter(rp => now - rp.t0 < 1400);
    for (const rp of G.ripples) { const u = (now - rp.t0) / 1400, [x, y] = P.get(rp.n) || [0, 0]; ctx.strokeStyle = rgba(rp.n.type === 'agent' ? C.agent : rp.n.type === 'human' ? C.human : C.mint, (1 - u) * 0.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, rp.n.r * Math.max(0.6, k) * (1 + u * 3 * rp.big), 0, Math.PI * 2); ctx.stroke(); }
    // labels for the focused neighbourhood (or everyone when zoomed in)
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const n of G.nodes) {
      const big = n.type === 'human' || n.type === 'agent' || n.type === 'reserved';
      if (!(big || n.type === 'entity') || !visibleNode(n)) continue;
      const onPath = PT && PT.set.has(n.id);
      const show = onPath || (big && ((focus && lit(n)) || k > 1.35 || n.you || n.id === G.kbd)) || (n.type === 'entity' && (k > 1.9 || n.id === G.hover)); if (!show) continue;
      const [x, y] = P.get(n); if (!on(x, y)) continue;
      const r = n.r * Math.min(1.8, Math.max(0.85, Math.sqrt(k))), label = String(n.label).replace(/ \(Demo\)$/, '') + (n.type === 'reserved' ? ' · unclaimed' : '');
      const ty = y + r + (n.type === 'human' ? 7 : 5), w = ctx.measureText(label).width + 10;
      ctx.fillStyle = 'rgba(5,7,11,0.66)'; rr(x - w / 2, ty - 2, w, 16, 5); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", sans-serif';
      ctx.fillStyle = onPath ? '#fff4c2' : n.type === 'human' ? '#ffe2cc' : n.type === 'agent' ? '#dfe6ff' : n.type === 'reserved' ? '#e8ecf4' : '#c9d3e3'; ctx.fillText(label, x, ty + 1);
    }
  }
  function frame(t) {
    raf = 0; if (!running) return;
    if (camAnim) camAnim(t);
    if (!RM.matches && G.alpha > 0.013) tick(); else if (!RM.matches && (t | 0) % 2 === 0) tick();
    draw(t);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && running && !document.hidden) raf = requestAnimationFrame(frame); }

  // ---------- hit testing ----------
  function nodeAt(sx, sy) {
    const k = G.cam.k; let best = null, bd = 1e9;
    for (const n of G.nodes) {
      if (!visibleNode(n)) continue;
      const [x, y] = toScreen(n.x, n.y), r = n.r * Math.min(1.8, Math.max(0.85, Math.sqrt(k))) + (n.type === 'intent' || n.type === 'post' ? 5 : 4);
      const d = Math.hypot(x - sx, y - sy); if (d < r && d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function edgeAt(sx, sy) {
    let best = null, bd = 7;
    for (const e of G.edges) {
      if (!visibleEdge(e) || e.type === 'intent' || e.type === 'post') continue;
      const [ax, ay] = toScreen(e.s.x, e.s.y), [bx, by] = toScreen(e.t.x, e.t.y);
      const [cx, cy] = ctrl(ax, ay, bx, by, e.type === 'tether' ? 0.05 : e.bend);
      for (let i = 1; i < 12; i++) { const q = i / 12, x = (1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx + q * q * bx, y = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy + q * q * by; const d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = e; } }
    }
    return best;
  }

  // ---------- input: hover, drag, pan, wheel/pinch zoom, click, keyboard ----------
  function bindInput() {
    const pts = new Map(); let drag = null, moved = 0, pinch0 = null;
    cv.addEventListener('pointerdown', e => {
      cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: G.cam.k }; drag = null; return; }
      const n = nodeAt(e.clientX, e.clientY);
      drag = n ? { node: n } : { pan: [e.clientX, e.clientY, G.cam.x, G.cam.y] };
      if (n) { n.fixed = true; [n.fx, n.fy] = [n.x, n.y]; }
      kick();
    });
    cv.addEventListener('pointermove', e => {
      if (pts.has(e.pointerId)) { const p = pts.get(e.pointerId); moved += Math.abs(e.clientX - p[0]) + Math.abs(e.clientY - p[1]); pts.set(e.pointerId, [e.clientX, e.clientY]); }
      if (pinch0 && pts.size === 2) { const [a, b] = [...pts.values()]; G.cam.k = Math.min(4, Math.max(0.25, pinch0.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d)); kick(); return; }
      if (drag && drag.node && moved > 3) { const [wx, wy] = toWorld(e.clientX, e.clientY); drag.node.fx = wx; drag.node.fy = wy; G.alpha = Math.max(G.alpha, 0.25); kick(); return; }
      if (drag && drag.pan) { G.cam.x = drag.pan[2] - (e.clientX - drag.pan[0]) / G.cam.k; G.cam.y = drag.pan[3] - (e.clientY - drag.pan[1]) / G.cam.k; camAnim = null; kick(); return; }
      if (e.pointerType === 'mouse') { const n = nodeAt(e.clientX, e.clientY); const id = n ? n.id : null; if (id !== G.hover) { G.hover = id; kick(); } cv.classList.toggle('pointing', !!n || !!edgeAt(e.clientX, e.clientY)); }
    });
    const end = e => {
      pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null;
      if (!drag) return;
      const d = drag; drag = null;
      if (d.node) { d.node.fixed = false; }
      if (moved < 6) {
        if (d.node) { if (G.onSelect) G.onSelect(d.node); }
        else { const ed = edgeAt(e.clientX, e.clientY); if (ed && G.onEdge) G.onEdge(ed, e.clientX, e.clientY); else if (G.onEdge) G.onEdge(null); }
      }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', () => { if (G.hover) { G.hover = null; kick(); } });
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      const [wx, wy] = toWorld(e.clientX, e.clientY);
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016));
      const k = Math.min(4, Math.max(0.25, G.cam.k * f));
      G.cam.x = wx - (e.clientX - W / 2) / k; G.cam.y = wy - (e.clientY - H / 2) / k; G.cam.k = k; camAnim = null; kick();
    }, { passive: false });
    cv.addEventListener('keydown', e => {
      const people = G.nodes.filter(n => (n.type === 'human' || n.type === 'agent') && visibleNode(n));
      if (!people.length) return;
      let cur = G.byId.get(G.kbd) || null;
      const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (dir) {
        e.preventDefault();
        if (!cur) cur = people.slice().sort((a, b) => Math.hypot(a.x - G.cam.x, a.y - G.cam.y) - Math.hypot(b.x - G.cam.x, b.y - G.cam.y))[0];
        else {
          let best = null, bs = 1e9;
          for (const n of people) { if (n === cur) continue; const dx = n.x - cur.x, dy = n.y - cur.y, along = dx * dir[0] + dy * dir[1]; if (along <= 4) continue; const s = along + Math.abs(dx * dir[1] + dy * dir[0]) * 2.2; if (s < bs) { bs = s; best = n; } }
          if (best) cur = best;
        }
        G.kbd = cur.id; G.hover = cur.id; animateCam({ x: cur.x, y: cur.y, k: Math.max(G.cam.k, 1.2) }, 350);
        if (G.onFocusText) G.onFocusText(cur); kick();
      } else if (e.key === 'Enter' && cur) { e.preventDefault(); if (G.onSelect) G.onSelect(cur); }
      else if (e.key === 'Escape') { G.kbd = null; G.hover = null; kick(); }
      else if (e.key === '+' || e.key === '=') { animateCam({ x: G.cam.x, y: G.cam.y, k: Math.min(4, G.cam.k * 1.3) }, 200); kick(); }
      else if (e.key === '-') { animateCam({ x: G.cam.x, y: G.cam.y, k: Math.max(0.25, G.cam.k / 1.3) }, 200); kick(); }
      else if (e.key === '0') { fit(); kick(); }
    });
    cv.addEventListener('blur', () => { G.kbd = null; });
  }
  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); kick();
  }

  // ---------- public API ----------
  window.PMGraph = {
    G,
    async init(canvas, { onSelect, onEdge, onFocusText, viewOffset } = {}) {
      cv = canvas; ctx = cv.getContext('2d', { alpha: false }); G.onSelect = onSelect; G.onEdge = onEdge; G.onFocusText = onFocusText; G.viewOffset = viewOffset;
      resize(); addEventListener('resize', resize); bindInput();
      document.addEventListener('visibilitychange', kick);
      RM.addEventListener('change', kick);
      running = true; await this.refresh(); kick();
      if (G.pendingPath !== undefined) { const p = G.pendingPath; delete G.pendingPath; this.showPath(p); }
    },
    async refresh() {
      try { const r = await fetch('/api/graph', { credentials: 'same-origin', headers: { accept: 'application/json' } }); if (!r.ok) return; load(await r.json()); kick(); } catch {}
    },
    select(id) { G.sel = id; kick(); },
    fly(id, k) { const ok = fly(id, k); kick(); return ok; },
    fit() { fit(); kick(); },
    filter(key, on) { if (on) G.hidden.delete(key); else G.hidden.add(key); kick(); },
    search(q) {
      q = String(q || '').trim().toLowerCase(); if (!q) return [];
      return G.nodes.filter(n => (n.type === 'human' || n.type === 'agent' || n.type === 'reserved' || n.type === 'entity' || n.type === 'intent') && String(n.label).toLowerCase().includes(q)).sort((a, b) => (a.type === 'intent') - (b.type === 'intent')).slice(0, 8);
    },
    showPath(ids) {
      if (!G.ready || !W) { G.pendingPath = ids; return; }   // graph not loaded yet: apply after the first load
      if (!ids || !ids.length) { if (G.path) { G.path = null; kick(); } return; }
      const keep = ids.filter(id => G.byId.has(id));
      G.path = { ids: keep, set: new Set(keep), t0: performance.now() }; G.sel = null;
      const list = keep.map(id => G.byId.get(id));
      if (list.length && W) {
        const b = bounds(list), off = typeof G.viewOffset === 'function' ? G.viewOffset() : { x: 0, y: 0 };
        const vw = Math.max(260, W - Math.abs(off.x) * 2 - 120), vh = H - 200;
        const k = Math.min(2.2, Math.max(0.35, Math.min(vw / (b.x1 - b.x0 + 120), vh / (b.y1 - b.y0 + 120))));
        animateCam({ x: (b.x0 + b.x1) / 2 - off.x / k, y: (b.y0 + b.y1) / 2 - off.y / k, k }, 900);
      }
      kick();
    },
    pulse, ripple, node: id => G.byId.get(id),
    people: () => G.nodes.filter(n => n.type === 'human'),
    stop() { running = false; },
  };
})();
