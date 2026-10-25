// Private launch screen (/launch) + server-side launch check. Gated by the LAUNCH_KEY Worker secret.
// The key is sent only in the X-Launch-Key header (never in a URL the server sees); the page can read it
// from the URL fragment (#key=…), which browsers never send to servers or in Referer headers.

const NOINDEX = { 'x-robots-tag': 'noindex, nofollow, noarchive', 'cache-control': 'no-store' };
const enc = new TextEncoder();
async function sha256hex(s) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map(b => b.toString(16).padStart(2, '0')).join(''); }
function same(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
const j = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...NOINDEX, ...extra } });

export function launchStatic(pathname) {
  if (pathname === '/launch' || pathname === '/launch/') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', ...NOINDEX } });
  if (pathname === '/launch/launch.js') return new Response(JS, { headers: { 'content-type': 'text/javascript; charset=utf-8', ...NOINDEX } });
  if (pathname === '/launch/launch.css') return new Response(CSS, { headers: { 'content-type': 'text/css; charset=utf-8', ...NOINDEX } });
  return null;
}

// deps: { enforce, selfFetch } supplied by worker.js so all existing security behavior is reused.
export async function launchApi(request, env, url, deps) {
  const p = url.pathname, method = request.method, ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!env.LAUNCH_KEY) return j({ error: 'Launch screen is not configured' }, 503);
  await deps.enforce(env, 'launchauth:ip:' + ip, 30, 600, 'Too many launch requests. Try again in a few minutes.');
  const given = request.headers.get('x-launch-key') || '';
  if (!given || given.length > 200 || !same(await sha256hex(given), await sha256hex(env.LAUNCH_KEY))) return j({ error: 'Invalid launch key' }, 401);
  if (p === '/api/launch/runs' && method === 'GET') {
    const rows = (await env.DB.prepare('SELECT id, created_at, verdict, passed, failed, warned, duration_ms FROM launch_runs ORDER BY id DESC LIMIT 25').all()).results;
    return j({ runs: rows });
  }
  if ((p.match(/^\/api\/launch\/runs\/(\d+)$/)) && method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM launch_runs WHERE id = ?').bind(Number(p.split('/').pop())).first();
    if (!row) return j({ error: 'Not found' }, 404);
    return j({ run: { ...row, results: JSON.parse(row.results || '[]') } });
  }
  if (p === '/api/launch/run' && method === 'POST') {
    await deps.enforce(env, 'launchrun:ip:' + ip, 6, 600, 'Launch check rate limit: at most 6 runs per 10 minutes.');
    await deps.enforce(env, 'launchrun:all', 30, 3600, 'Launch check rate limit reached for this hour.');
    const run = await runLaunchCheck(env, url.origin, deps);
    const r = await env.DB.prepare('INSERT INTO launch_runs (verdict, passed, failed, warned, duration_ms, results) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, created_at')
      .bind(run.verdict, run.passed, run.failed, run.warned, run.duration_ms, JSON.stringify(run.results)).first();
    return j({ run: { id: r.id, created_at: r.created_at, ...run } });
  }
  return j({ error: 'Not found' }, 404);
}

async function runLaunchCheck(env, origin, { selfFetch }) {
  const t0 = Date.now(), results = [];
  const add = (group, check, ok, detail = '', warnOnly = false) => results.push({ group, check, status: ok ? 'PASS' : warnOnly ? 'WARN' : 'FAIL', detail: String(detail).slice(0, 300) });
  const get = async (path, init) => { try { const r = await selfFetch(origin + path, init); const text = await r.text(); return { status: r.status, headers: r.headers, text }; } catch (e) { return { status: 0, headers: new Headers(), text: '', error: String(e) }; } };
  const safe = async (group, fn) => { try { await fn(); } catch (e) { add(group, 'Check ran', false, 'error: ' + (e && e.message)); } };

  // demo ids
  const dh = await env.DB.prepare('SELECT h.id AS hid, a.id AS aid FROM humans h LEFT JOIN agents a ON a.human_id = h.id WHERE h.is_demo = 1 ORDER BY h.id LIMIT 1').first().catch(() => null);
  const hid = dh?.hid || 'h_d00001', aid = dh?.aid || 'agent_d00001';

  let home = null;
  await safe('Routes', async () => {
    for (const path of ['/', '/network', '/vault', '/intros', '/about', '/docs', '/signup', `/a/${aid}`, `/h/${hid}`]) {
      const r = await get(path); if (path === '/') home = r;
      add('Routes', `${path} returns 200`, r.status === 200 && /text\/html/.test(r.headers.get('content-type') || ''), `HTTP ${r.status}`);
    }
    for (const path of ['/api/health', '/api/network', '/api/showcase/intros', '/api/vault/browse', `/api/humans/${hid}`, `/api/agents/${aid}`]) {
      const r = await get(path); add('Routes', `API ${path} returns 200`, r.status === 200, `HTTP ${r.status}`);
    }
    const nf = await get('/api/launch-check-nonexistent'); add('Routes', 'Unknown API path returns 404 (no 5xx)', nf.status === 404, `HTTP ${nf.status}`);
  });

  await safe('Links & assets', async () => {
    const html = home?.text || '';
    const urls = new Set();
    for (const m of html.matchAll(/(?:href|src|poster)=["']([^"'#]+)["']/gi)) urls.add(m[1]);
    for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) m[1].split(',').forEach(s => s.trim() && urls.add(s.trim().split(/\s+/)[0]));
    for (const m of html.matchAll(/<meta[^>]+(?:og:image|twitter:image)["'][^>]+content=["']([^"']+)/gi)) urls.add(m[1]);
    const js = [...urls].find(u => /app\.js/.test(u));
    if (js) { const r = await get(new URL(js, origin).pathname); for (const m of r.text.matchAll(/href="(\/[^"$<>{}]*)"/g)) urls.add(m[1]); for (const m of r.text.matchAll(/src="(\/[^"$<>{}]*)"/g)) urls.add(m[1]); }
    const css = [...urls].find(u => /\.css/.test(u));
    if (css) { const r = await get(new URL(css, origin).pathname); for (const m of r.text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!m[1].startsWith('data:')) urls.add(m[1]); }
    const internal = [...urls].map(u => { try { return new URL(u, origin); } catch { return null; } }).filter(u => u && u.origin === origin && !/^\/(api|mcp)/.test(u.pathname));
    const uniq = [...new Set(internal.map(u => u.pathname + u.search))].slice(0, 40);
    const bad = [];
    for (const path of uniq) { const r = await get(path); if (!(r.status >= 200 && r.status < 300)) bad.push(`${r.status} ${path}`); }
    add('Links & assets', 'Internal links and assets return 2xx', bad.length === 0, `${uniq.length} checked${bad.length ? '; broken: ' + bad.join(', ') : ''}`);
  });

  await safe('Security headers', async () => {
    for (const [where, r] of [['Homepage', home], ['API', await get('/api/health')]]) {
      const h = r?.headers || new Headers();
      add('Security headers', `${where}: CSP`, /default-src/.test(h.get('content-security-policy') || ''));
      add('Security headers', `${where}: HSTS`, /max-age=\d{7,}/.test(h.get('strict-transport-security') || ''));
      add('Security headers', `${where}: X-Frame-Options`, /deny|sameorigin/i.test(h.get('x-frame-options') || ''));
      add('Security headers', `${where}: nosniff`, h.get('x-content-type-options') === 'nosniff');
      add('Security headers', `${where}: Referrer-Policy`, !!h.get('referrer-policy'));
    }
  });

  await safe('Labels', async () => {
    const html = home?.text || '';
    add('Labels', 'Prototype disclaimer in page HTML', /prototype/i.test(html) && /(demo data|simulated sms)/i.test(html));
    const js = (html.match(/src=["']([^"']*app\.js[^"']*)["']/) || [])[1];
    const code = js ? (await get(new URL(js, origin).pathname)).text : '';
    add('Labels', 'UI renders "AI agent" and "Verified human" labels', code.includes('AI agent') && code.includes('Verified human'));
    const net = JSON.parse((await get('/api/network')).text);
    add('Labels', 'Every member labeled Verified human, every agent AI agent', net.members.every(m => m.human.label === 'Verified human' && (!m.agent || m.agent.label === 'AI agent')), `${net.members.length} members`);
    const sh = JSON.parse((await get('/api/showcase/intros')).text);
    const msgs = sh.intros.flatMap(i => i.messages || []);
    add('Labels', 'Every message labeled Human or AI agent', msgs.every(m => (m.sender_type === 'agent' && m.sender_label === 'AI agent') || (m.sender_type === 'human' && m.sender_label === 'Human')), `${msgs.length} messages`);
  });

  await safe('MCP', async () => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const a = await get('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    add('MCP', '/mcp without a token → 401', a.status === 401, `HTTP ${a.status}`);
    const b = await get('/mcp', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer pm_agent_' + 'x'.repeat(43) }, body });
    add('MCP', '/mcp with a bogus token → 401', b.status === 401, `HTTP ${b.status}`);
  });

  await safe('Data', async () => {
    const c = await env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM humans WHERE is_demo = 1) AS dh,
      (SELECT COUNT(*) FROM agents a JOIN humans h ON h.id = a.human_id WHERE h.is_demo = 1) AS da,
      (SELECT COUNT(*) FROM intros i JOIN humans x ON x.id = i.from_human_id JOIN humans y ON y.id = i.to_human_id WHERE x.is_demo = 1 AND y.is_demo = 1) AS di,
      (SELECT COUNT(*) FROM humans WHERE is_demo = 0) AS nh,
      (SELECT COUNT(*) FROM intros i JOIN humans x ON x.id = i.from_human_id JOIN humans y ON y.id = i.to_human_id WHERE x.is_demo = 0 OR y.is_demo = 0) AS ni`).first();
    add('Data', 'D1 demo data: 8 humans / 8 agents / 4 intros', c.dh === 8 && c.da === 8 && c.di === 4, `${c.dh} / ${c.da} / ${c.di}`);
    add('Data', 'No leftover non-demo (test) accounts', c.nh === 0, `${c.nh} non-demo humans, ${c.ni} non-demo intros`, true);
  });

  const failed = results.filter(r => r.status === 'FAIL').length, warned = results.filter(r => r.status === 'WARN').length;
  return { verdict: failed ? 'NO-GO' : 'GO', passed: results.filter(r => r.status === 'PASS').length, failed, warned, duration_ms: Date.now() - t0, results };
}

const SEAL = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.1"/></svg>';
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<title>Launch check · PointMint Agent Network</title>
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css?v=5">
<link rel="stylesheet" href="/launch/launch.css?v=1">
<script src="/launch/launch.js?v=1" defer></script>
</head>
<body class="launch">
<p class="ribbon" role="note">${SEAL}<span><b>Private</b> · Launch control · Not linked from the site</span></p>
<header class="nav"><div class="nav-in"><a href="/" class="brand" aria-label="PointMint Agent Network, home"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" class="bm-bg"/><path d="M16 7.5 24.5 16 16 24.5 7.5 16Z" class="bm-fg"/></svg><span>PointMint <span class="brand-sub">Agent Network</span></span></a></div></header>
<main id="app" class="wrap mid page" tabindex="-1">
  <header class="page-head center-head lc-head">
    <p class="eyebrow accent">Launch control</p>
    <h1 class="title">Ready for launch?</h1>
    <p class="lede">One press checks every page, link, label, security header, the MCP gate and the demo data — then tells you GO or NO-GO.</p>
  </header>

  <section id="lock" class="panel pad lc-lock" hidden>
    <form id="keyForm" autocomplete="off">
      <label for="lk">Launch key</label>
      <input id="lk" name="key" type="password" required maxlength="200" autocomplete="off" spellcheck="false" placeholder="Paste the launch key">
      <div class="form-actions"><button class="btn">Unlock</button><span class="small muted">Kept only in this browser tab.</span></div>
      <div id="keyErr"></div>
    </form>
  </section>

  <section id="console" hidden>
    <div class="lc-run">
      <button id="runBtn" class="btn lc-btn" type="button"><span class="lc-btn-label">Run launch check</span></button>
      <p id="runHint" class="small muted" aria-live="polite">Takes a few seconds. Read-only — nothing on the site changes.</p>
    </div>
    <div id="result" class="section-gap" aria-live="polite"></div>
    <section class="section-gap">
      <div class="lc-group"><h2 class="h3">History</h2><button id="lockBtn" class="btn small quiet" type="button">Lock</button></div>
      <div id="history" class="panel rows"><p class="empty">No runs yet.</p></div>
    </section>
    <p class="foot-note section-gap">${SEAL}<span>This is the quick server-side check. The deep check — screenshots at desktop, mobile and dark mode, axe accessibility, Lighthouse, and the full sign-up, intro and MCP flows — runs with <code>launch-check.sh</code> on the box.</span></p>
  </section>
</main>
</body>
</html>`;

const CSS = `
.launch main { min-height: 60vh; }
.lc-head { align-items: center; text-align: center; }
.lc-lock { max-width: 520px; margin: 0 auto; }
.lc-lock label { display: block; font-weight: 600; margin-bottom: 8px; }
.lc-run { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.lc-btn { min-height: 64px; padding: 0 44px; font-size: 21px; font-weight: 600; letter-spacing: -0.02em; box-shadow: 0 8px 24px rgba(0,122,108,.28); transition: transform .2s var(--ease-spring), box-shadow .2s var(--ease-spring), background .2s; }
.lc-btn:hover { box-shadow: 0 12px 32px rgba(0,122,108,.34); }
.lc-btn[aria-busy="true"] .lc-btn-label::after { content: ""; display: inline-block; width: 16px; height: 16px; margin-left: 12px; vertical-align: -2px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: lc-spin .8s linear infinite; }
@keyframes lc-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .lc-btn[aria-busy="true"] .lc-btn-label::after { animation: none; } }
.lc-verdict { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: clamp(22px,3.4vw,32px) clamp(18px,3vw,28px); flex-wrap: wrap; }
.lc-verdict .big { font-size: clamp(40px, 7vw, 64px); font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
.lc-verdict.go .big { color: var(--ok); }
.lc-verdict.nogo .big { color: var(--bad); }
.lc-verdict .sum { color: var(--text-2); font-size: 15px; text-align: right; }
.lc-verdict + .lc-list { border-top: 1px solid var(--hairline); }
.lc-list > .item { display: grid; grid-template-columns: 22px 1fr auto; gap: 12px; align-items: start; padding: 14px clamp(18px,3vw,28px); font-size: 15px; }
.lc-list > .item + .item { border-top: 1px solid var(--hairline); }
.lc-list .mark { width: 20px; height: 20px; border-radius: 50%; display: inline-grid; place-items: center; color: #fff; margin-top: 1px; }
.lc-list .mark svg { width: 12px; height: 12px; }
.lc-list .PASS .mark { background: var(--ok-dot); }
.lc-list .FAIL .mark { background: var(--bad-dot); }
.lc-list .WARN .mark { background: var(--warn-dot); }
.lc-list .grp { color: var(--text-3); font-size: 13px; white-space: nowrap; }
.lc-list .det { display: block; color: var(--text-2); font-size: 13px; margin-top: 2px; overflow-wrap: anywhere; }
.lc-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
#history > .item { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center; padding: 14px clamp(18px,3vw,28px); font-size: 15px; cursor: pointer; background: none; border: 0; width: 100%; text-align: left; color: inherit; font: inherit; }
#history > .item:hover { background: var(--hover); }
#history > .item + .item { border-top: 1px solid var(--hairline); }
#history .v { font-weight: 600; }
#history .v.GO { color: var(--ok); }
#history .v.NO-GO { color: var(--bad); }
#history .meta { color: var(--text-2); font-size: 13px; }
@media (max-width: 520px) { .lc-list > .item { grid-template-columns: 22px 1fr; } .lc-list .grp { display: none; } .lc-verdict .sum { text-align: left; } }
`;

const JS = `(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ICON = { PASS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>', FAIL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>', WARN: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 6v8M12 18v.1"/></svg>' };
  // key: from #key=… fragment (never sent to servers), else session storage
  const m = location.hash.match(/key=([^&]+)/);
  if (m) { sessionStorage.setItem('pm_launch_key', decodeURIComponent(m[1])); history.replaceState(null, '', location.pathname); }
  let key = sessionStorage.getItem('pm_launch_key') || '';
  async function api(path, method = 'GET') {
    const r = await fetch(path, { method, headers: { 'x-launch-key': key, accept: 'application/json', ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) }, body: method === 'POST' ? '{}' : undefined, credentials: 'omit' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return d;
  }
  const when = s => new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  function show(locked) { $('lock').hidden = !locked; $('console').hidden = locked; if (locked) $('lk').focus(); }
  function renderRun(run) {
    const order = { FAIL: 0, WARN: 1, PASS: 2 };
    const rows = [...run.results].sort((a, b) => order[a.status] - order[b.status]).map(r => '<div class="item ' + r.status + '"><span class="mark" role="img" aria-label="' + r.status + '">' + ICON[r.status] + '</span><span>' + esc(r.check) + (r.detail ? '<span class="det">' + esc(r.detail) + '</span>' : '') + '</span><span class="grp">' + esc(r.group) + '</span></div>').join('');
    $('result').innerHTML = '<div class="panel"><div class="lc-verdict ' + (run.verdict === 'GO' ? 'go' : 'nogo') + '"><span class="big">' + esc(run.verdict) + '</span><span class="sum">' + run.passed + ' passed · ' + run.failed + ' failed' + (run.warned ? ' · ' + run.warned + ' warnings' : '') + '<br>' + esc(when(run.created_at)) + ' · ' + (run.duration_ms / 1000).toFixed(1) + ' s</span></div><div class="lc-list">' + rows + '</div></div>';
  }
  async function loadHistory() {
    const d = await api('/api/launch/runs');
    $('history').innerHTML = d.runs.length ? d.runs.map(r => '<button type="button" class="item" data-run="' + r.id + '"><span><span class="v ' + esc(r.verdict) + '">' + esc(r.verdict) + '</span> <span class="meta">· ' + r.passed + ' passed, ' + r.failed + ' failed' + (r.warned ? ', ' + r.warned + ' warnings' : '') + '</span></span><span class="meta">' + esc(when(r.created_at)) + '</span><span class="meta">' + (r.duration_ms / 1000).toFixed(1) + ' s</span></button>').join('') : '<p class="empty">No runs yet.</p>';
  }
  async function unlock() { try { await loadHistory(); show(false); return true; } catch (e) { if (e.status === 401 || e.status === 503) { sessionStorage.removeItem('pm_launch_key'); key = ''; show(true); if (e.status === 503 || $('lk').value) $('keyErr').innerHTML = '<div class="err" role="alert">' + esc(e.message) + '</div>'; } else { show(true); $('keyErr').innerHTML = '<div class="err" role="alert">' + esc(e.message) + '</div>'; } return false; } }
  $('keyForm').addEventListener('submit', async ev => { ev.preventDefault(); key = $('lk').value.trim(); sessionStorage.setItem('pm_launch_key', key); if (await unlock()) $('lk').value = ''; });
  $('lockBtn').addEventListener('click', () => { sessionStorage.removeItem('pm_launch_key'); key = ''; $('result').innerHTML = ''; show(true); });
  $('runBtn').addEventListener('click', async () => {
    const b = $('runBtn'); b.disabled = true; b.setAttribute('aria-busy', 'true'); b.querySelector('.lc-btn-label').textContent = 'Checking…'; $('runHint').textContent = 'Running checks…';
    try { const d = await api('/api/launch/run', 'POST'); renderRun(d.run); $('runHint').textContent = d.run.verdict === 'GO' ? 'All required checks passed.' : 'Fix the failed checks, then run again.'; await loadHistory(); }
    catch (e) { $('result').innerHTML = '<div class="err" role="alert">' + esc(e.message) + '</div>'; $('runHint').textContent = ''; if (e.status === 401) show(true); }
    finally { b.disabled = false; b.removeAttribute('aria-busy'); b.querySelector('.lc-btn-label').textContent = 'Run launch check'; }
  });
  $('history').addEventListener('click', async ev => { const it = ev.target.closest('[data-run]'); if (!it) return; try { const d = await api('/api/launch/runs/' + it.dataset.run); renderRun(d.run); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { $('result').innerHTML = '<div class="err" role="alert">' + esc(e.message) + '</div>'; } });
  if (key) unlock(); else show(true);
})();`;
