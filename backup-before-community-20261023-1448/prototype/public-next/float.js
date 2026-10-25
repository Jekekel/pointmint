/* Floating middle panel (desktop >= 1024px): drag by the header grip, collapse to a pill, remember position + state.
   Phones/tablets (< 1024px) keep the bottom sheet; its collapse button turns it into a pill too. Classic script: shares app.js globals. */
P.grip = '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>';
P.minimize = '<path d="M6 12h12"/>';
P.feed = '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>';
const FP_KEY = 'pm-fp-v1';
const FP = { s: (() => { try { const v = JSON.parse(store.get(FP_KEY, '{}')); return v && typeof v === 'object' ? v : {}; } catch { return {}; } })(), moved: false };
// s: { c: collapsed, f: floating, x, y, w, h: panel box; px, py: pill position; pd: pill was dragged }
const fpSave = () => store.set(FP_KEY, JSON.stringify(FP.s));
const fpDeck = () => document.getElementById('deck'), fpApp = () => document.getElementById('app'), fpPill = () => document.getElementById('fpPill');
const fpDesk = () => !mobileMQ.matches;
const fpUndockH = h => Math.round(Math.max(360, Math.min(h - 96, innerHeight * 0.74)));
function fpGrip() { return `<button type="button" class="fp-grip" id="fpGrip" aria-label="Move panel: arrow keys move it, Enter or Space collapses it, Home resets it" title="Drag to move · double-click to reset">${icon('grip')}</button>`; }
function fpMin() { return `<button type="button" class="fp-min" data-action="fp-toggle" aria-label="Collapse the panel" title="Collapse">${icon('minimize')}</button>`; }
function fpTop() { const d = fpDeck(); return d ? d.getBoundingClientRect().top : 60; }
function fpClamp(x, y, w, h) {
  const top = fpTop(), m = 8;
  return [Math.round(Math.min(Math.max(m, x), Math.max(m, innerWidth - w - m))), Math.round(Math.min(Math.max(top, y), Math.max(top, innerHeight - h - m)))];
}
function fpDockRect() { // where the panel sits when docked in the grid (measured with floating briefly off)
  const d = fpDeck(), a = fpApp(), prev = d.dataset.fp; d.dataset.fp = 'dock'; const r = a.getBoundingClientRect(); d.dataset.fp = prev; return r;
}
function fpApply() {
  const d = fpDeck(), a = fpApp(), p = fpPill(); if (!d || !a || !p) return;
  const s = FP.s, desk = fpDesk();
  if (desk && s.f) { const maxH = innerHeight - fpTop() - 8; if (s.h > maxH) s.h = Math.max(320, maxH); if (s.w > innerWidth - 16) s.f = false; }   // too wide for the window: snap back to the dock
  d.dataset.fp = s.c ? 'pill' : desk && s.f ? 'float' : 'dock';
  if (desk && s.f && !s.c) { [s.x, s.y] = fpClamp(s.x, s.y, s.w, s.h); a.style.setProperty('--fx', s.x + 'px'); a.style.setProperty('--fy', s.y + 'px'); a.style.setProperty('--fw', s.w + 'px'); a.style.setProperty('--fh', s.h + 'px'); }
  p.hidden = !s.c;
  if (s.c && desk) { const r = p.getBoundingClientRect(); [s.px, s.py] = fpClamp(s.px ?? 0, s.py ?? fpTop(), r.width || 180, r.height || 44); p.style.setProperty('--px', s.px + 'px'); p.style.setProperty('--py', s.py + 'px'); }
  const g = document.getElementById('fpGrip'); if (g) g.setAttribute('aria-expanded', String(!s.c));
}
function fpLabel() {
  const a = fpApp(), p = fpPill(); if (!a || !p) return;
  const t = a.querySelector('.m-title'), n = a.querySelectorAll('.post').length || a.querySelectorAll('.thread-row, .rows > .item').length;
  p.querySelector('.fp-l').textContent = t ? t.textContent : 'Panel';
  const c = p.querySelector('.fp-n'); c.textContent = n ? String(n) : ''; c.hidden = !n;
  p.setAttribute('aria-label', `Expand the panel: ${t ? t.textContent : 'Panel'}${n ? `, ${n} items` : ''}`);
}
function fpCollapse(on) {
  const s = FP.s; if (!!s.c === on) return;
  if (on) {
    const r = fpApp().getBoundingClientRect();
    if (!s.f) { s.w = Math.round(r.width); s.h = fpUndockH(r.height); }
    if (!s.pd || !fpDesk()) { s.px = Math.round(r.left + 12); s.py = Math.round(r.top + 8); }
    s.c = true;
  } else {
    s.c = false;
    if (s.pd && fpDesk()) { if (!s.w) { const r = fpDockRect(); s.w = Math.round(r.width); s.h = fpUndockH(r.height); } s.x = s.px - 12; s.y = s.py - 8; s.f = true; s.pd = false; }
    if (!fpDesk() && typeof setSheet === 'function') setSheet('peek');
  }
  fpSave(); fpLabel(); fpApply();
  const next = on ? fpPill() : document.getElementById('fpGrip'); if (next) next.focus({ preventScroll: true });
  if (window.PMGraph && PMGraph.fit && on) { /* graph shows through; nothing to move */ }
}
function fpReset() { Object.assign(FP.s, { f: false, c: false, pd: false }); fpSave(); fpApply(); }
function fpMoveBy(dx, dy) {
  const s = FP.s;
  if (s.c) { s.px = (s.px || 0) + dx; s.py = (s.py || 0) + dy; s.pd = true; }
  else { if (!s.f) { const r = fpApp().getBoundingClientRect(); Object.assign(s, { f: true, x: r.left, y: r.top, w: Math.round(r.width), h: fpUndockH(r.height) }); } s.x += dx; s.y += dy; }
  fpApply(); fpSave();
}
function fpSnap() { // dropped near the dock: snap back into it
  const s = FP.s; if (!s.f || s.c) return; const r = fpDockRect();
  if (Math.abs(s.x - r.left) < 40 && Math.abs(s.y - r.top) < 40 && Math.abs(s.w - r.width) < 2) s.f = false;
}
// pointer drag (mouse, pen and touch) on the header or the pill
function fpBindDrag() {
  const start = (e, mode) => {
    if (!fpDesk() || e.button > 0) return;
    const s = FP.s, el = mode === 'pill' ? fpPill() : fpApp(), r = el.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    FP.moved = false;
    const mv = ev => {
      const dx = ev.clientX - x0, dy = ev.clientY - y0;
      if (!FP.moved && Math.hypot(dx, dy) < 5) return;
      if (!FP.moved) { FP.moved = true; fpDeck().classList.add('fp-dragging'); fpPill().classList.add('dragging'); if (mode === 'panel' && !s.f) Object.assign(s, { f: true, w: Math.round(r.width), h: fpUndockH(r.height) }); }
      if (mode === 'pill') { s.px = r.left + dx; s.py = r.top + dy; s.pd = true; } else { s.x = r.left + dx; s.y = r.top + dy; }
      fpApply(); ev.preventDefault();
    };
    const up = () => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      fpDeck().classList.remove('fp-dragging'); fpPill().classList.remove('dragging');
      if (FP.moved) { if (mode === 'panel') fpSnap(); fpApply(); fpSave(); setTimeout(() => { FP.moved = false; }, 0); }
    };
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('#fpPill')) return start(e, 'pill');
    const h = e.target.closest('#app .m-head'); if (!h) return;
    if (e.target.closest('button:not(.fp-grip), a, input, select, textarea, label, [role="tab"]')) return;
    e.preventDefault(); start(e, 'panel');
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#fpPill')) { if (FP.moved) { e.preventDefault(); return; } fpCollapse(false); return; }
    if (e.target.closest('[data-action="fp-toggle"]') || e.target.closest('.fp-grip')) { if (FP.moved) return; fpCollapse(!FP.s.c); }
    if (e.target.closest('[data-action="sheet-pill"]')) fpCollapse(true);
  });
  document.addEventListener('dblclick', e => { if (e.target.closest('#app .m-head') && !e.target.closest('button:not(.fp-grip), a, input, label')) fpReset(); });
  document.addEventListener('keydown', e => {
    const g = e.target.closest && e.target.closest('.fp-grip, #fpPill'); if (!g || !fpDesk()) return;
    const step = e.shiftKey ? 64 : 16, k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (k) { e.preventDefault(); fpMoveBy(k[0], k[1]); }
    else if (e.key === 'Home') { e.preventDefault(); fpReset(); const gg = document.getElementById('fpGrip'); if (gg) gg.focus(); }
  });
  let rz = 0; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fpApply(); }); });
  mobileMQ.addEventListener('change', fpApply);
}
function fpAfterRender() { fpLabel(); fpApply(); }
// the graph's "visible area" moves with the panel
function fpOffset() {
  const s = FP.s; if (!s.c && !s.f) return null;
  const l = document.getElementById('colL').getBoundingClientRect(), r = document.getElementById('colR').getBoundingClientRect();
  return { x: (l.right + r.left) / 2 - innerWidth / 2, y: 0 };
}
fpBindDrag();
