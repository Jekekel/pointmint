// PointMint Agent Network — pre-launch "launch check" (deep check, runs on the box).
// Usage: node scripts/launch-check.mjs [base-url] [report-dir]
//   Normally run via ../launch-check.sh which sets PATH and the report folder.
// READ-ONLY against production except: the existing test scripts (and one MCP probe) create test
// accounts with +1555 numbers; afterwards ONLY rows created by this run (is_demo=0, +1555…, created
// after the run started) are deleted via `wrangler d1 execute --remote`. Never prints full credentials.
import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(HERE, '..');
const ROOT = path.resolve(PROTO, '..');
const TOOLS = process.env.LAUNCH_TOOLS || path.join(ROOT, 'launch-tools');
const req = createRequire(path.join(TOOLS, 'package.json'));
const { chromium } = req('playwright-core');
const AXE_SRC = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

const BASE = (process.argv[2] || 'https://agents.pointmint.io').replace(/\/$/, '');
const ORIGIN = new URL(BASE).origin;
const stamp = new Date().toLocaleString('sv-SE', { hour12: false }).replace(/[-:]/g, '').replace(' ', '-').slice(0, 13);
const OUT = path.resolve(process.argv[3] || path.join(ROOT, 'launch-checks', stamp));
const SHOTS = path.join(OUT, 'screenshots');
mkdirSync(SHOTS, { recursive: true });
const T0 = Date.now();
const RUN_START_ISO = new Date(T0 - 120_000).toISOString(); // 2-min slack for clock skew
const IS_LOCAL = /^(localhost|127\.)/.test(new URL(BASE).hostname);
const SKIP_FLOWS = process.env.SKIP_FLOWS === '1';
const SKIP_LH = process.env.SKIP_LIGHTHOUSE === '1';

// ---------------- results ----------------
const results = []; // {area, check, status: PASS|FAIL|WARN|NOTE, detail}
const add = (area, check, status, detail = '') => { results.push({ area, check, status, detail: String(detail).replace(/\s+/g, ' ').trim().slice(0, 900) }); log(`${status.padEnd(4)} [${area}] ${check}${detail ? ' — ' + String(detail).slice(0, 200) : ''}`); };
const passFail = (area, check, ok, detail, failStatus = 'FAIL') => add(area, check, ok ? 'PASS' : failStatus, detail);
function log(...a) { const t = ((Date.now() - T0) / 1000).toFixed(0).padStart(4); console.log(`[${t}s]`, ...a); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const IGNORE_RE = /static\.cloudflareinsights\.com|\/cdn-cgi\/rum|cloudflareinsights/i;
let beaconSeen = 0;

async function http(url, opts = {}) {
  const t = Date.now();
  try {
    const r = await fetch(url, { redirect: 'manual', ...opts, signal: AbortSignal.timeout(opts.timeout || 20000) });
    const buf = opts.method === 'HEAD' ? Buffer.alloc(0) : Buffer.from(await r.arrayBuffer());
    return { status: r.status, headers: r.headers, body: buf, text: () => buf.toString('utf8'), ms: Date.now() - t };
  } catch (e) { return { status: 0, error: String(e.message || e), headers: new Headers(), body: Buffer.alloc(0), text: () => '', ms: Date.now() - t }; }
}
const fmtMB = n => (n / 1048576).toFixed(2) + ' MB';
const isInternal = u => { try { return new URL(u, BASE).origin === ORIGIN; } catch { return false; } };

// ---------------- discover demo ids (generic) ----------------
let demo = { human: null, agent: null, intro: null };
async function discover() {
  const n = await http(BASE + '/api/network');
  try { const d = JSON.parse(n.text()); const m = d.members.find(x => x.human.is_demo && x.agent) || d.members[0]; demo.human = m?.human.id; demo.agent = m?.agent?.id; } catch {}
  const s = await http(BASE + '/api/showcase/intros');
  try { demo.intro = JSON.parse(s.text()).intros[0]?.id; } catch {}
  demo.human ||= 'h_d00001'; demo.agent ||= 'agent_d00001';
}

// ---------------- 1/8/9: HTTP-level checks ----------------
const ROUTES = () => ['/', '/network', '/vault', '/intros', '/about', '/docs', '/signup', `/a/${demo.agent}`, `/h/${demo.human}`];
let homeHeaders = null;
async function httpChecks() {
  for (const p of ROUTES()) {
    const r = await http(BASE + p);
    passFail('1 Routes', `GET ${p} returns 200`, r.status === 200 && /<html/i.test(r.text()), `HTTP ${r.status || r.error} in ${r.ms} ms`);
    if (p === '/') homeHeaders = r.headers;
  }
  for (const p of ['/api/health', '/api/network', '/api/showcase/intros', `/api/humans/${demo.human}`, `/api/agents/${demo.agent}`, '/api/vault/browse']) {
    const r = await http(BASE + p);
    passFail('1 Routes', `API ${p} returns 200`, r.status === 200, `HTTP ${r.status || r.error}`);
  }
  const r404 = await http(BASE + '/api/definitely-not-here');
  passFail('1 Routes', 'Unknown API path returns a clean 404', r404.status === 404, `HTTP ${r404.status}`);
  // security headers (9)
  const checkHdrs = (where, h) => {
    const csp = h.get('content-security-policy') || '', hsts = h.get('strict-transport-security') || '';
    passFail('9 Security', `${where}: Content-Security-Policy`, /default-src/.test(csp), csp.slice(0, 120) || 'missing');
    passFail('9 Security', `${where}: HSTS`, /max-age=\d{7,}/.test(hsts), hsts || 'missing');
    passFail('9 Security', `${where}: X-Frame-Options`, /deny|sameorigin/i.test(h.get('x-frame-options') || '') || /frame-ancestors/.test(csp), h.get('x-frame-options') || 'missing');
    passFail('9 Security', `${where}: X-Content-Type-Options nosniff`, (h.get('x-content-type-options') || '') === 'nosniff', h.get('x-content-type-options') || 'missing');
    passFail('9 Security', `${where}: Referrer-Policy`, !!h.get('referrer-policy'), h.get('referrer-policy') || 'missing');
  };
  if (homeHeaders) checkHdrs('Homepage', homeHeaders);
  checkHdrs('API', (await http(BASE + '/api/health')).headers);
  // private launch screen: must be noindex and locked without the key
  { const lp = await http(BASE + '/launch'); const la = await http(BASE + '/api/launch/runs');
    if (lp.status === 200) passFail('9 Security', 'Private /launch screen is noindex and rejects requests without the key', /noindex/.test(lp.headers.get('x-robots-tag') || '') && /noindex/.test(lp.text()) && la.status === 401, `page ${lp.status} x-robots-tag "${lp.headers.get('x-robots-tag') || ''}", API without key ${la.status}`); }
  // SEO (8) – raw HTML
  const html = (await http(BASE + '/')).text();
  const meta = (re) => (html.match(re) || [])[1];
  const title = meta(/<title[^>]*>([^<]*)<\/title>/i);
  passFail('8 SEO/share', 'Page <title>', !!title, title || 'missing', 'WARN');
  const desc = meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  passFail('8 SEO/share', 'Meta description', !!desc, desc ? `${desc.length} chars` : 'missing', 'WARN');
  const canon = meta(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  passFail('8 SEO/share', 'Canonical link', !!canon, canon || 'missing', 'WARN');
  for (const k of ['og:title', 'og:description', 'og:image', 'twitter:card', 'twitter:image']) {
    const v = meta(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]+content=["']([^"']*)`, 'i'));
    passFail('8 SEO/share', `${k} tag`, !!v, v || 'missing', 'WARN');
    if (v && /image/.test(k)) { const ir = await http(new URL(v, BASE).href); passFail('8 SEO/share', `${k} image reachable`, ir.status === 200 && /^image\//.test(ir.headers.get('content-type') || ''), `HTTP ${ir.status} ${ir.headers.get('content-type') || ''} ${fmtMB(ir.body.length)}`, 'WARN'); }
  }
  const fav = meta(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']*)/i) || '/favicon.ico';
  const fr = await http(new URL(fav, BASE).href);
  passFail('8 SEO/share', 'Favicon reachable', fr.status === 200 && /image|svg|icon/.test(fr.headers.get('content-type') || ''), `${fav} HTTP ${fr.status} ${fr.headers.get('content-type') || ''}`, 'WARN');
  const rb = await http(BASE + '/robots.txt');
  const robotsReal = rb.status === 200 && /text\/plain/.test(rb.headers.get('content-type') || '') && /user-agent/i.test(rb.text());
  passFail('8 SEO/share', 'robots.txt', robotsReal, robotsReal ? rb.text().split('\n').slice(0, 3).join(' | ') : `missing (HTTP ${rb.status}, ${rb.headers.get('content-type') || ''} — SPA fallback page, not a robots file)`, 'WARN');
  const sm = await http(BASE + '/sitemap.xml');
  const smReal = sm.status === 200 && /xml/.test(sm.headers.get('content-type') || '') && /<urlset|<sitemapindex/.test(sm.text());
  add('8 SEO/share', 'sitemap.xml', smReal ? 'PASS' : 'WARN', smReal ? 'present' : 'not present (optional)');
  // data-level labeling (4)
  try {
    const d = JSON.parse((await http(BASE + '/api/network')).text());
    passFail('4 Labels', 'API: every member is a "Verified human" and every agent an "AI agent"', d.members.every(m => m.human.label === 'Verified human' && (!m.agent || m.agent.label === 'AI agent')), `${d.members.length} members`);
  } catch (e) { add('4 Labels', 'API labels', 'FAIL', e.message); }
}

// ---------------- 11: MCP + sign-in cookie flags ----------------
// /api/auth/start allows 5 per IP per fixed 10-min UTC window. Usage is remembered across runs in a small state file.
const OTP_STATE = path.join(ROOT, 'launch-checks', '.otp-window.json');
let { w: otpWindow, used: otpStartsUsed } = (() => { try { return JSON.parse(readFileSync(OTP_STATE, 'utf8')); } catch { return { w: 0, used: 0 }; } })();
const saveOtp = () => { try { writeFileSync(OTP_STATE, JSON.stringify({ w: otpWindow, used: otpStartsUsed })); } catch {} };
async function useStarts(n, label) {
  const w = Math.floor(Date.now() / 600000); if (w !== otpWindow) { otpWindow = w; otpStartsUsed = 0; }
  if (otpStartsUsed + n > 5) { const wait = (w + 1) * 600000 - Date.now() + 3000; log(`waiting ${(wait / 1000).toFixed(0)}s for a fresh sign-up rate-limit window before: ${label}`); await sleep(wait); otpWindow = w + 1; otpStartsUsed = 0; }
  otpStartsUsed += n; saveOtp();
}
async function waitNextWindow(label) { const w = Math.floor(Date.now() / 600000); const wait = (w + 1) * 600000 - Date.now() + 3000; log(`retrying after the next sign-up rate-limit window (${(wait / 1000).toFixed(0)}s): ${label}`); await sleep(wait); otpWindow = w + 1; otpStartsUsed = 0; saveOtp(); }

async function mcpCheck() {
  let cookie = '';
  const j = async (p, { method = 'GET', body, auth } = {}) => {
    const h = { 'content-type': 'application/json', accept: 'application/json' }; if (cookie) h.cookie = cookie; if (auth) h.authorization = 'Bearer ' + auth;
    const r = await fetch(BASE + p, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc && /^__Host-/.test(sc)) cookie = sc.split(';')[0];
    return { status: r.status, sc, data: await r.json().catch(() => null) };
  };
  let r = await j('/mcp', { method: 'POST', body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
  passFail('11 MCP', '/mcp without a token is rejected with 401', r.status === 401, `HTTP ${r.status}`);
  r = await j('/mcp', { method: 'POST', auth: 'pm_agent_' + 'x'.repeat(43), body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
  passFail('11 MCP', '/mcp with a bogus token is rejected with 401', r.status === 401, `HTTP ${r.status}`);
  for (let attempt = 0; attempt < 2; attempt++) {
    await useStarts(1, 'MCP probe sign-up');
    const phone = '+1555' + String(Math.floor(Math.random() * 9e6) + 1e6);
    r = await j('/api/auth/start', { method: 'POST', body: { phone } });
    if (r.status === 429 && attempt === 0) { await waitNextWindow('MCP probe'); continue; }
    if (r.status !== 200) { add('11 MCP', 'Create fresh test account for MCP probe', 'FAIL', `auth/start HTTP ${r.status} ${r.data?.error || ''}`); return; }
    const v = await j('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name: 'Launch Check Tester', headline: 'Launch check (test account)' } });
    const sc = v.sc || '';
    passFail('9 Security', 'Sign-in cookie flags (__Host-, HttpOnly, Secure, SameSite, Path=/)', /^__Host-/.test(sc) && /HttpOnly/i.test(sc) && /Secure/i.test(sc) && /SameSite=(Lax|Strict)/i.test(sc) && /Path=\//.test(sc),
      sc.replace(/=[^;]+;/, '=<redacted>;'));
    const m = await j('/api/agent', { method: 'POST', body: { name: 'Launch check agent', provider: 'Other' } });
    const tok = m.data?.credential;
    if (!tok) { add('11 MCP', 'Mint fresh test credential', 'FAIL', `HTTP ${m.status}`); return; }
    const init = await j('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'launch-check', version: '1' } } } });
    passFail('11 MCP', 'initialize works with a fresh credential', init.status === 200 && !!init.data?.result?.capabilities?.tools, `protocol ${init.data?.result?.protocolVersion}, server ${init.data?.result?.serverInfo?.name}`);
    const tl = await j('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', id: 2, method: 'tools/list' } });
    const names = (tl.data?.result?.tools || []).map(t => t.name);
    passFail('11 MCP', 'tools/list works', tl.status === 200 && names.length > 0, `${names.length} tools: ${names.join(', ')}`);
    await j('/api/agent/revoke', { method: 'POST' });
    const after = await j('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', id: 3, method: 'tools/list' } });
    passFail('11 MCP', 'Credential rejected after revoke', after.status === 401, `HTTP ${after.status}`);
    return;
  }
}

// ---------------- 10: existing functional scripts ----------------
function run(script, args = []) {
  return new Promise(res => {
    const t = Date.now(); let out = '';
    const c = spawn(process.execPath, [path.join(PROTO, 'scripts', script), BASE, ...args], { cwd: PROTO });
    c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d);
    const kill = setTimeout(() => c.kill('SIGKILL'), 240000);
    c.on('close', code => { clearTimeout(kill); writeFileSync(path.join(OUT, `log-${script.replace('.mjs', '')}.txt`), out.replace(/pm_agent_[A-Za-z0-9_-]{20,}/g, 'pm_agent_<redacted>')); res({ code, out, ms: Date.now() - t }); });
  });
}
async function e2e() {
  for (let attempt = 0; attempt < 2; attempt++) {
    await useStarts(4, 'e2e.mjs');
    const r = await run('e2e.mjs');
    const m = r.out.match(/(\d+) passed, (\d+) failed/);
    if (attempt === 0 && !(r.code === 0 && m && m[2] === '0')) { add('10 Functional', 'e2e.mjs first attempt failed (often the shared sign-up rate limit) — retried once', 'NOTE', r.out.split('\n').filter(l => l.startsWith('FAIL')).map(l => l.slice(5, 80)).join('; ') || r.out.split('\n').filter(Boolean).slice(-1)[0]); await waitNextWindow('e2e.mjs'); continue; }
    const fails = r.out.split('\n').filter(l => l.startsWith('FAIL')).map(l => l.slice(5, 120));
    passFail('10 Functional', 'e2e.mjs (sign-up, one-agent rule, vault, MCP tools, intros, audit, rotate/revoke, rate limits)', r.code === 0 && m && m[2] === '0',
      m ? `${m[1]} passed, ${m[2]} failed in ${(r.ms / 1000).toFixed(0)}s${fails.length ? ' — ' + fails.join('; ') : ''}` : `crashed (exit ${r.code}): ${r.out.split('\n').filter(Boolean).slice(-2).join(' ')}`);
    return;
  }
}
async function twoHumans() {
  for (let attempt = 0; attempt < 2; attempt++) {
    await useStarts(2, 'two-humans.mjs');
    const r = await run('two-humans.mjs');
    if (attempt === 0 && r.code !== 0) { add('10 Functional', 'two-humans.mjs first attempt crashed (often the shared sign-up rate limit) — retried once', 'NOTE', r.out.split('\n').filter(Boolean).slice(-1)[0]); await waitNextWindow('two-humans.mjs'); continue; }
    const get = k => { const l = r.out.split('\n').find(x => x.startsWith(k)); return l ? l.slice(48).trim() : undefined; };
    const exp = [['proposed', 'pending_human_approval'], ['recipient sees it before sender approval?', 'false'], ['recipient accept before sender approval', /^(403|409)$/], ['sender human approves', 'pending_recipient'],
      ['recipient tries to approve (sender-only)', '403'], ['contact before accept', 'null'], ['recipient human accepts', 'accepted'], ['contact revealed to sender after both approve', 'bob-test@example.com'],
      ['agent send_message', 'AI agent'], ['human message', '201'], ['thread labels', 'AI agent | Human'], ['anonymous can view private intro', '404']];
    const bad = exp.filter(([k, v]) => { const g = get(k); return v instanceof RegExp ? !v.test(g || '') : g !== v; }).map(([k, v]) => `${k}: got ${get(k)} expected ${v}`);
    passFail('10 Functional', 'two-humans.mjs (agent proposes → human approves → recipient accepts → contact revealed → labeled messages)', r.code === 0 && !bad.length,
      bad.length ? bad.join('; ') : `${exp.length}/${exp.length} expectations met in ${(r.ms / 1000).toFixed(0)}s`);
    return;
  }
}
async function rateTest() {
  for (let attempt = 0; attempt < 2; attempt++) {
    await useStarts(1, 'ratetest.mjs');
    const r = await run('ratetest.mjs');
    if (attempt === 0 && /start failed/.test(r.out)) { await waitNextWindow('ratetest.mjs'); continue; }
    const ok = /calls 1-60 all 200: true \| first 429 at call # 61/.test(r.out);
    passFail('10 Functional', 'ratetest.mjs (MCP 60 calls/min per credential, 61st → 429)', ok, r.out.split('\n').filter(Boolean).slice(-1)[0]);
    return;
  }
}
// Delete only rows created by THIS run's test accounts (is_demo=0, +1555 test numbers, created after run start).
function cleanupSql() {
  const H = `(SELECT id FROM humans WHERE is_demo=0 AND phone_e164 LIKE '+1555%' AND created_at >= '${RUN_START_ISO}')`;
  return [
    `DELETE FROM messages WHERE intro_id IN (SELECT id FROM intros WHERE from_human_id IN ${H} OR to_human_id IN ${H})`,
    `DELETE FROM messages WHERE sender_human_id IN ${H}`,
    `DELETE FROM intros WHERE from_human_id IN ${H} OR to_human_id IN ${H}`,
    `DELETE FROM vault_items WHERE human_id IN ${H}`,
    `DELETE FROM audit_log WHERE human_id IN ${H} OR agent_id IN (SELECT id FROM agents WHERE human_id IN ${H})`,
    `DELETE FROM sessions WHERE human_id IN ${H}`,
    `DELETE FROM agents WHERE human_id IN ${H}`,
    `DELETE FROM otp_requests WHERE phone_e164 IN (SELECT phone_e164 FROM humans WHERE id IN ${H})`,
    `DELETE FROM humans WHERE id IN ${H}`,
  ].join(';\n') + ';\n';
}
function cleanup(label) {
  return new Promise(res => {
    if (process.env.SKIP_CLEANUP === '1') { add('10 Functional', `Cleanup (${label})`, 'WARN', 'skipped (SKIP_CLEANUP=1)'); return res(); }
    const f = path.join(OUT, `cleanup-${label}.sql`); writeFileSync(f, cleanupSql());
    const npx = path.join(path.dirname(process.execPath), 'npx');
    execFile(npx, ['wrangler', 'd1', 'execute', 'pointmint-agents-db', IS_LOCAL ? '--local' : '--remote', '--file', f, '--yes'], { cwd: PROTO, timeout: 180000, env: process.env }, (err, so, se) => {
      const out = (so || '') + (se || ''); writeFileSync(path.join(OUT, `log-cleanup-${label}.txt`), out);
      if (err) add('10 Functional', `Delete this run's test accounts (${label})`, 'FAIL', 'wrangler d1 execute failed: ' + out.split('\n').filter(Boolean).slice(-3).join(' '));
      else log(`cleanup (${label}) done`);
      res(!err);
    });
  });
}
async function verifyCounts() {
  let d; for (let i = 0; i < 3; i++) { try { d = JSON.parse((await http(BASE + '/api/network')).text()); break; } catch { await sleep(2000); } }
  if (!d) return add('10 Functional', 'Demo counts after cleanup', 'FAIL', 'could not read /api/network');
  const s = d.stats, nonDemo = d.members.filter(m => !m.human.is_demo);
  passFail('10 Functional', 'After cleanup: exactly 8 demo humans / 8 agents / 4 intros', s.humans === 8 && s.agents === 8 && s.intros === 4 && !nonDemo.length,
    `humans ${s.humans}, agents ${s.agents}, intros ${s.intros}, public cards ${s.public_items}${nonDemo.length ? `; non-demo members still present: ${nonDemo.map(m => m.human.name).join(', ')}` : ''}`);
}

// ---------------- 2–6: browser checks ----------------
const KEY = () => [['landing', '/'], ['network', '/network'], ['vault', '/vault'], ['intros', '/intros'], ['about', '/about'], ['docs', '/docs'], ['signup', '/signup'], ['agent', `/a/${demo.agent}`], ['human', `/h/${demo.human}`]];
const INIT = () => {
  window.__cls = 0; window.__lcp = 0;
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
};
async function settle(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  await page.waitForFunction(() => { const m = document.querySelector('main') || document.body; return m && m.innerText.trim().length > 40 && !/^Loading…?$/.test(m.innerText.trim()); }, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(700);
}
async function scrollThrough(page) {
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += Math.max(400, innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
  await page.waitForTimeout(500);
}
function watch(page, bag) {
  page.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (IGNORE_RE.test(t)) beaconSeen++; else bag.console.push(t.slice(0, 220)); } });
  page.on('pageerror', e => bag.console.push('Uncaught: ' + String(e.message || e).slice(0, 220)));
  page.on('requestfailed', rq => { const u = rq.url(); if (IGNORE_RE.test(u)) { beaconSeen++; return; } const f = rq.failure()?.errorText || ''; if (/ERR_ABORTED/.test(f) && /media|video/.test(rq.resourceType())) return; bag.failed.push(`${rq.method()} ${u} (${f})`); });
  page.on('response', async rs => {
    const u = rs.url(); if (IGNORE_RE.test(u)) return;
    const st = rs.status(); if (st >= 400) bag.failed.push(`${st} ${u}`);
    const rt = rs.request().resourceType();
    if (rt === 'image' || rt === 'media' || /^(image|video)\//.test(rs.headers()['content-type'] || '')) {
      let size = Number(rs.headers()['content-length'] || 0); const cr = rs.headers()['content-range']; if (cr && /\/(\d+)/.test(cr)) size = Number(cr.match(/\/(\d+)/)[1]);
      if (!size && rt === 'image') { try { size = (await rs.body()).length; } catch {} }
      bag.media.set(u, { type: rt === 'media' || /video/.test(rs.headers()['content-type'] || '') ? 'video' : 'image', size, status: st });
    }
  });
}
const DOM_AUDIT = () => {
  const vw = innerWidth, main = document.querySelector('main') || document.body;
  const small = (el, re) => { for (let n = el, i = 0; n && i < 7; n = n.parentElement, i++) { const t = n.innerText || ''; if (t.length > 700 || n === document.body) break; if (re.test(t)) return true; } return false; };
  const desc = el => { const t = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('href') || el.className || el.tagName).toString().replace(/\s+/g, ' ').trim(); return `${el.tagName.toLowerCase()}${el.getAttribute('href') ? `[${el.getAttribute('href')}]` : ''} "${t.slice(0, 50)}"`; };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  // agents: links to agent pages, agent marks, agent messages, explicit data-kind
  const agentEls = [...main.querySelectorAll('a[href^="/a/"], .agent-mark, .msg.agent, [data-kind="ai_agent"], [data-kind="agent"]')].filter(visible);
  const agentBad = agentEls.filter(el => !small(el, /AI agent/));
  // humans: round monograms + profile/member/human-message containers
  const humanEls = [...main.querySelectorAll('.avatar, a[href^="/h/"], .msg.human, [data-kind="human"]')].filter(visible).filter(el => !el.closest('.msg.agent'));
  const humanBad = humanEls.filter(el => !(el.matches('.msg.human') ? small(el, /\bHuman\b|verified human/i) : small(el, /verified human/i)));
  const text = document.body.innerText;
  const disclaimer = /prototype/i.test(text) && /(demo data|simulated sms|fictional)/i.test(text);
  // headings
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(h => Number(h.tagName[1]));
  const skips = []; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push(`h${hs[i - 1]}→h${hs[i]}`);
  // images / video
  const imgs = [...document.images].map(i => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.hasAttribute('alt'), w: i.naturalWidth, dw: i.clientWidth }));
  const videos = [...document.querySelectorAll('video')].map(v => ({ src: v.currentSrc || v.src || [...v.querySelectorAll('source')].map(s => s.src)[0] || '', sources: [...v.querySelectorAll('source')].map(s => s.src), poster: v.poster || '', networkState: v.networkState, readyState: v.readyState, error: v.error ? v.error.code : null, muted: v.muted, autoplay: v.autoplay, playsinline: v.playsInline }));
  // urls to crawl / verify
  const urls = new Set();
  document.querySelectorAll('a[href]').forEach(a => urls.add('a ' + a.href));
  document.querySelectorAll('img[src],video[src],source[src],script[src],iframe[src],audio[src]').forEach(e => urls.add('asset ' + e.src));
  document.querySelectorAll('img[srcset],source[srcset]').forEach(e => e.srcset.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean).forEach(s => urls.add('asset ' + new URL(s, location.href).href)));
  document.querySelectorAll('video[poster]').forEach(v => urls.add('asset ' + v.poster));
  document.querySelectorAll('link[href]').forEach(l => urls.add('asset ' + l.href));
  document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(m => m.content && urls.add('asset ' + new URL(m.content, location.href).href));
  // CSS background images
  for (const el of document.querySelectorAll('body *')) { const b = getComputedStyle(el).backgroundImage; if (b && b !== 'none') for (const m of b.matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!m[1].startsWith('data:')) urls.add('asset ' + new URL(m[1], location.href).href); }
  // overflow
  const sw = document.documentElement.scrollWidth;
  const over = sw > vw + 1 ? [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 6).map(desc) : [];
  const h1 = document.querySelectorAll('h1').length;
  const rendered = main.innerText.trim().length > 40 && !document.querySelector('.page-error, [role="alert"].err');
  const notFound = /not found/i.test(main.innerText);
  return { agentCount: agentEls.length, agentBad: agentBad.slice(0, 5).map(desc), humanCount: humanEls.length, humanBad: humanBad.slice(0, 5).map(desc), disclaimer, hs, skips, h1, imgs, videos, urls: [...urls], sw, vw, over, cls: window.__cls || 0, lcp: window.__lcp || 0, rendered, notFound, title: document.title };
};

async function focusCheck(page) {
  return page.evaluate(async () => {
    const els = [...document.querySelectorAll('a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).slice(0, 12);
    const bad = [];
    for (const el of els) {
      const before = getComputedStyle(el); const b = { o: before.outlineStyle + before.outlineWidth + before.outlineColor, s: before.boxShadow, bg: before.backgroundColor, bc: before.borderColor, td: before.textDecorationLine };
      el.focus({ focusVisible: true });
      const a = getComputedStyle(el);
      const changed = (a.outlineStyle !== 'none' && parseFloat(a.outlineWidth) > 0) || a.boxShadow !== b.s || a.backgroundColor !== b.bg || a.borderColor !== b.bc || a.textDecorationLine !== b.td;
      if (!changed) bad.push(`${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}"`);
      el.blur();
    }
    return { tested: els.length, bad };
  });
}

const urlStatus = new Map();
async function checkUrl(u) {
  if (urlStatus.has(u)) return urlStatus.get(u);
  const p = (async () => { let r = await http(u, { method: 'HEAD', timeout: 15000 }); if (r.status === 0 || r.status === 405 || r.status === 403 || r.status === 501) r = await http(u, { timeout: 20000, headers: { range: 'bytes=0-1023' } });
    let size = Number(r.headers.get('content-length') || 0); const cr = r.headers.get('content-range'); if (cr && /\/(\d+)/.test(cr)) size = Number(cr.match(/\/(\d+)/)[1]);
    if (r.status >= 300 && r.status < 400) { const loc = r.headers.get('location'); if (loc) { const f = await http(new URL(loc, u).href, { method: 'HEAD' }); return { status: f.status, redirected: true, size, type: f.headers.get('content-type') || '' }; } }
    return { status: r.status, size, type: r.headers.get('content-type') || '', error: r.error }; })();
  urlStatus.set(u, p); return p;
}

async function browserChecks(browser) {
  const pageReports = {};
  // --- desktop light: deep audit + crawl ---
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(INIT);
  const toVisit = KEY().map(([n, p]) => [n, p]); const seen = new Set(toVisit.map(x => x[1])); const allUrls = new Map(); // url -> Set(pages)
  const MAX = Number(process.env.CRAWL_MAX || 40);
  let mediaAll = new Map();
  for (let i = 0; i < toVisit.length && i < MAX; i++) {
    const [name, p] = toVisit[i]; const key = i < KEY().length;
    const page = await ctx.newPage(); const bag = { console: [], failed: [], media: new Map() }; watch(page, bag);
    let status = 0; try { const resp = await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }); status = resp?.status() || 0; } catch (e) { bag.failed.push('navigation: ' + e.message.slice(0, 120)); }
    await settle(page); await scrollThrough(page); await settle(page);
    const d = await page.evaluate(DOM_AUDIT);
    if (key) await page.screenshot({ path: path.join(SHOTS, `${name}-desktop.png`), fullPage: true });
    pageReports[p] = { name, status, ...d, console: bag.console, failed: bag.failed };
    for (const [u, m] of bag.media) mediaAll.set(u, { ...m, page: p });
    for (const e of d.urls) { const [kind, u] = [e.slice(0, e.indexOf(' ')), e.slice(e.indexOf(' ') + 1)]; if (!/^https?:/.test(u)) continue; const k = u.split('#')[0];
      if (!allUrls.has(k)) allUrls.set(k, { kind, pages: new Set() }); allUrls.get(k).pages.add(p);
      if (kind === 'a' && isInternal(k)) { const pth = new URL(k).pathname + new URL(k).search; if (!seen.has(pth) && !/^\/(api|mcp|launch)/.test(pth) && seen.size < MAX) { seen.add(pth); toVisit.push([pth, pth]); } } }
    if (key) {
      const f = await focusCheck(page); pageReports[p].focus = f;
    }
    await page.close();
  }
  // render + 5xx + labels + disclaimer + console per page
  for (const [p, r] of Object.entries(pageReports)) {
    const isKey = KEY().some(k => k[1] === p);
    passFail('1 Routes', `${p} renders in a real browser`, r.status === 200 && r.rendered && !r.notFound, `HTTP ${r.status}, title "${r.title}"${r.notFound ? ', shows "not found"' : ''}${!r.rendered ? ', main content empty or error shown' : ''}`);
    passFail('4 Labels', `${p}: every AI agent element labeled "AI agent"`, r.agentBad.length === 0, `${r.agentCount} agent elements${r.agentBad.length ? '; unlabeled: ' + r.agentBad.join(', ') : ''}`);
    passFail('4 Labels', `${p}: every human shown carries a "Verified human" label`, r.humanBad.length === 0, `${r.humanCount} human elements${r.humanBad.length ? '; name shown without the label: ' + r.humanBad.join(', ') : ''}`, 'WARN'); // unlabeled agent = blocker; unlabeled human name = warning
    passFail('4 Labels', `${p}: prototype disclaimer present`, r.disclaimer, r.disclaimer ? 'found' : 'no "Prototype … demo data/simulated SMS" text on page');
    passFail('3 Console', `${p}: no console errors`, r.console.length === 0, r.console.slice(0, 4).join(' | ') || 'clean');
    passFail('3 Console', `${p}: no failed requests`, r.failed.length === 0, r.failed.slice(0, 4).join(' | ') || 'clean');
    if (isKey) {
      const brokenImgs = r.imgs.filter(i => !i.ok);
      passFail('2 Assets', `${p}: all images decode`, brokenImgs.length === 0, `${r.imgs.length} <img>${brokenImgs.length ? '; broken: ' + brokenImgs.map(i => i.src).join(', ') : ''}`);
      const noAlt = r.imgs.filter(i => !i.alt);
      passFail('6 Accessibility', `${p}: images have alt text`, noAlt.length === 0, `${r.imgs.length} <img>${noAlt.length ? '; missing alt: ' + noAlt.map(i => i.src).join(', ') : ''}`);
      for (const v of r.videos) {
        passFail('2 Assets', `${p}: video has a loadable source`, !!v.src && v.error == null && v.networkState !== 3, `src ${v.src || 'none'} readyState ${v.readyState} error ${v.error}`);
        passFail('2 Assets', `${p}: video has a poster image`, !!v.poster, v.poster || 'no poster attribute', 'WARN');
        if (v.autoplay) passFail('2 Assets', `${p}: autoplay video is muted + playsinline`, v.muted && v.playsinline, `muted ${v.muted}, playsinline ${v.playsinline}`, 'WARN');
      }
      passFail('6 Accessibility', `${p}: heading order`, r.h1 === 1 && r.skips.length === 0, `${r.h1} h1; sequence ${r.hs.join(',')}${r.skips.length ? '; skips ' + r.skips.join(' ') : ''}`, 'WARN');
      if (r.focus) passFail('6 Accessibility', `${p}: focus is visible on interactive elements`, r.focus.bad.length === 0, `${r.focus.tested} tested${r.focus.bad.length ? '; no visible focus: ' + r.focus.bad.slice(0, 4).join(', ') : ''}`, 'WARN');
      passFail('5 Visual', `${p}: layout shift (CLS) desktop`, r.cls < 0.1, `CLS ${r.cls.toFixed(3)}`, r.cls >= 0.25 ? 'FAIL' : 'WARN');
    }
  }
  // links/assets 2xx
  const entries = [...allUrls.entries()];
  const checks = await Promise.all(entries.map(async ([u, m]) => [u, m, await checkUrl(u)]));
  const badInt = checks.filter(([u, m, s]) => isInternal(u) && !(s.status >= 200 && s.status < 300));
  const badExt = checks.filter(([u, m, s]) => !isInternal(u) && !(s.status >= 200 && s.status < 400));
  passFail('2 Assets', 'All internal links and assets return 2xx', badInt.length === 0, `${checks.filter(c => isInternal(c[0])).length} internal URLs checked across ${Object.keys(pageReports).length} pages${badInt.length ? '; broken: ' + badInt.slice(0, 8).map(([u, m, s]) => `${s.status} ${new URL(u).pathname} (on ${[...m.pages][0]})`).join(', ') : ''}`);
  passFail('2 Assets', 'External links reachable', badExt.length === 0, `${checks.filter(c => !isInternal(c[0])).length} external URLs${badExt.length ? '; problems: ' + badExt.map(([u, m, s]) => `${s.status || s.error} ${u}`).join(', ') : ''}`, 'WARN');
  // media weight (all pages, emphasis on landing/hero)
  for (const [u, s] of checks) { const ct = s.type || ''; if (/^(image|video)\//.test(ct) && !mediaAll.has(u)) mediaAll.set(u, { type: ct.startsWith('video') ? 'video' : 'image', size: s.size, page: [...allUrls.get(u).pages][0] }); }
  const heavy = [...mediaAll.entries()].filter(([u, m]) => (m.type === 'image' && m.size > 2 * 1048576) || (m.type === 'video' && m.size > 8 * 1048576));
  const landingMedia = [...mediaAll.entries()].filter(([u, m]) => m.page === '/');
  passFail('2 Assets', 'Media weight (images ≤ 2 MB, videos ≤ 8 MB)', heavy.length === 0,
    `${mediaAll.size} media files; landing page media total ${fmtMB(landingMedia.reduce((a, [, m]) => a + (m.size || 0), 0))}${heavy.length ? '; too heavy: ' + heavy.map(([u, m]) => `${new URL(u).pathname} ${fmtMB(m.size)}`).join(', ') : ''}`, 'WARN');
  await ctx.close();

  // --- mobile 390 light + dark desktop + dark mobile landing ---
  for (const [tag, opts] of [['mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' }], ['desktop-dark', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }], ['mobile-dark', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' }]]) {
    const c = await browser.newContext(opts); await c.addInitScript(INIT);
    const list = tag === 'mobile-dark' ? KEY().slice(0, 2) : KEY();
    for (const [name, p] of list) {
      const page = await c.newPage(); const bag = { console: [], failed: [], media: new Map() }; watch(page, bag);
      try { await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }); } catch {}
      await settle(page); await scrollThrough(page); await settle(page);
      const d = await page.evaluate(DOM_AUDIT);
      await page.screenshot({ path: path.join(SHOTS, `${name}-${tag}.png`), fullPage: true });
      if (tag === 'mobile') {
        passFail('5 Visual', `${p}: no horizontal overflow at 390 px`, d.sw <= d.vw + 1, `page width ${d.sw}px vs viewport ${d.vw}px${d.over.length ? '; wide elements: ' + d.over.join(', ') : ''}`);
        passFail('5 Visual', `${p}: layout shift (CLS) mobile`, d.cls < 0.1, `CLS ${d.cls.toFixed(3)}`, d.cls >= 0.25 ? 'FAIL' : 'WARN');
        if (bag.console.length) add('3 Console', `${p}: console errors on mobile`, 'FAIL', bag.console.slice(0, 3).join(' | '));
      }
      if (tag === 'desktop-dark') {
        // dark mode sanity: background actually dark, text readable
        const dm = await page.evaluate(() => { const lum = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return 1; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }; return { bg: lum(getComputedStyle(document.body).backgroundColor), fg: lum(getComputedStyle(document.body).color) }; });
        passFail('5 Visual', `${p}: dark mode applies (dark background, light text)`, dm.bg < 0.3 && dm.fg > 0.6, `bg luminance ${dm.bg.toFixed(2)}, text ${dm.fg.toFixed(2)}`, 'WARN');
      }
      await page.close();
    }
    await c.close();
  }

  // --- 404 page ---
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await c.newPage(); const bag = { console: [], failed: [], media: new Map() }; watch(page, bag);
    // Chrome itself logs "Failed to load resource … status of 404" for a document served with a real 404; that one is expected.
    const resp = await page.goto(BASE + '/this-page-does-not-exist-' + Date.now(), { waitUntil: 'load' }); await settle(page);
    const d = await page.evaluate(DOM_AUDIT); await page.screenshot({ path: path.join(SHOTS, `404-desktop.png`), fullPage: true });
    const st = resp?.status();
    passFail('1 Routes', '404 page is sane (no 5xx, shows "not found", has a way home, keeps nav + disclaimer)', st < 500 && d.notFound && d.urls.some(u => u === 'a ' + ORIGIN + '/') && d.disclaimer && bag.console.filter(t => !/status of 404/.test(t)).length === 0, `HTTP ${st}; "not found" shown ${d.notFound}${bag.console.length ? '; console: ' + bag.console.join(' | ').slice(0, 200) : ''}`);
    if (st === 200) add('1 Routes', 'Unknown pages return HTTP 200 (soft 404 from SPA fallback)', 'NOTE', 'Search engines may index junk URLs; consider returning 404 status for unknown routes later');
    await c.close();
  }

  // --- axe-core ---
  {
    const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, bypassCSP: true });
    const byRule = new Map(); const minorAll = new Map();
    for (const [name, p] of KEY()) {
      const page = await c.newPage(); await page.goto(BASE + p, { waitUntil: 'load' }); await settle(page); await scrollThrough(page);
      await page.evaluate(AXE_SRC);
      const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }, resultTypes: ['violations'] }));
      for (const v of res.violations) {
        const map = (v.impact === 'serious' || v.impact === 'critical') ? byRule : minorAll;
        if (!map.has(v.id)) map.set(v.id, { impact: v.impact, help: v.help, pages: [], nodes: 0, examples: new Set() });
        const e = map.get(v.id); e.pages.push(p); e.nodes += v.nodes.length; v.nodes.slice(0, 3).forEach(n => e.examples.size < 4 && e.examples.add((n.target || []).join(' ').slice(0, 90)));
      }
      writeFileSync(path.join(OUT, `axe-${name}.json`), JSON.stringify(res.violations, null, 1));
      await page.close();
    }
    if (!byRule.size) add('6 Accessibility', `axe-core: no serious/critical violations on ${KEY().length} key pages`, 'PASS');
    for (const [id, e] of byRule) add('6 Accessibility', `axe-core ${e.impact}: ${id} — ${e.help}`, 'FAIL', `${e.nodes} elements on ${e.pages.length} page(s): ${e.pages.join(', ')}; e.g. ${[...e.examples].join(' | ')}`);
    if (minorAll.size) add('6 Accessibility', 'axe-core minor/moderate issues', 'NOTE', [...minorAll].map(([id, e]) => `${id} (${e.impact}, ${e.pages.length} pages)`).join('; '));
    await c.close();
  }
}

// ---------------- 7: Lighthouse ----------------
async function lighthouse(browser) {
  if (SKIP_LH) return add('7 Performance', 'Lighthouse', 'WARN', 'skipped (SKIP_LIGHTHOUSE=1)');
  const lhBin = path.join(TOOLS, 'node_modules', '.bin', 'lighthouse');
  const outJson = path.join(OUT, 'lighthouse-mobile.json');
  const ok = await new Promise(res => {
    const c = spawn(lhBin, [BASE + '/', '--quiet', '--output=json', '--output=html', `--output-path=${path.join(OUT, 'lighthouse-mobile')}`, '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox'], { env: { ...process.env, CHROME_PATH: CHROME } });
    let err = ''; c.stderr.on('data', d => err += d); const k = setTimeout(() => c.kill('SIGKILL'), 150000);
    c.on('close', code => { clearTimeout(k); res(code === 0 ? true : err.slice(-300)); });
  });
  const jf = path.join(OUT, 'lighthouse-mobile.report.json');
  if (ok === true && existsSync(jf)) {
    const d = JSON.parse(readFileSync(jf, 'utf8'));
    for (const [k, v] of Object.entries(d.categories)) passFail('7 Performance', `Lighthouse mobile: ${v.title}`, v.score >= 0.9, `score ${Math.round(v.score * 100)}`, 'WARN');
    const a = d.audits; add('7 Performance', 'Lighthouse key metrics (mobile, simulated slow 4G)', 'NOTE', `FCP ${a['first-contentful-paint']?.displayValue}, LCP ${a['largest-contentful-paint']?.displayValue}, TBT ${a['total-blocking-time']?.displayValue}, CLS ${a['cumulative-layout-shift']?.displayValue}, Speed Index ${a['speed-index']?.displayValue}; total weight ${a['total-byte-weight']?.displayValue}`);
    const failing = Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== 'informative' && x.scoreDisplayMode !== 'manual' && x.scoreDisplayMode !== 'notApplicable').slice(0, 8).map(x => x.title);
    if (failing.length) add('7 Performance', 'Lighthouse opportunities', 'NOTE', failing.join('; '));
    return;
  }
  // fallback: Playwright timing
  add('7 Performance', 'Lighthouse could not run — using browser timing fallback', 'WARN', String(ok));
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true }); await c.addInitScript(INIT); const page = await c.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' }); await settle(page);
  const t = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp: fcp?.startTime, lcp: window.__lcp, cls: window.__cls, bytes: performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), n.transferSize || 0) }; });
  passFail('7 Performance', 'Browser timing (unthrottled): LCP < 2.5 s', (t.lcp || t.load) < 2500, `TTFB ${t.ttfb.toFixed(0)} ms, FCP ${t.fcp?.toFixed(0)} ms, LCP ${t.lcp?.toFixed(0)} ms, load ${t.load.toFixed(0)} ms, ${fmtMB(t.bytes)}`, 'WARN');
  await c.close();
}

// ---------------- report ----------------
function report() {
  const ms = Date.now() - T0;
  const fails = results.filter(r => r.status === 'FAIL'), warns = results.filter(r => r.status === 'WARN'), notes = results.filter(r => r.status === 'NOTE');
  if (beaconSeen) notes.push({ area: '3 Console', check: 'Cloudflare Web Analytics beacon blocked by CSP (known, ignored)', status: 'NOTE', detail: `${beaconSeen} occurrences of static.cloudflareinsights.com being refused by script-src 'self'. Harmless; analytics just isn't collected. Allow the host in CSP or turn off the beacon if analytics is wanted.` });
  const verdict = fails.length ? 'NO-GO' : 'GO';
  const esc = s => String(s).replace(/\|/g, '\\|');
  const icon = s => ({ PASS: '✅ PASS', FAIL: '❌ FAIL', WARN: '⚠️ WARN', NOTE: 'ℹ️ NOTE' })[s];
  const shots = (() => { try { return readdirSafe(SHOTS); } catch { return []; } })();
  let md = `# Launch check — ${verdict}\n\n`;
  md += `- **Site:** ${BASE}\n- **Started:** ${new Date(T0).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n- **Runtime:** ${Math.floor(ms / 60000)}m ${Math.round(ms / 1000) % 60}s\n`;
  md += `- **Totals:** ${results.filter(r => r.status === 'PASS').length} passed · ${fails.length} failed · ${warns.length} warnings · ${notes.length} notes\n\n`;
  md += `## ${verdict === 'GO' ? 'Verdict: GO ✅' : 'Verdict: NO-GO ❌'}\n\n`;
  md += fails.length ? `### Blockers (must fix before launch)\n\n${fails.map(f => `- **[${f.area}] ${f.check}** — ${f.detail}`).join('\n')}\n\n` : 'No blockers. Every required check passed.\n\n';
  if (warns.length) md += `### Warnings (worth fixing, not blocking)\n\n${warns.map(f => `- [${f.area}] ${f.check} — ${f.detail}`).join('\n')}\n\n`;
  if (notes.length) md += `### Notes\n\n${notes.map(f => `- [${f.area}] ${f.check} — ${f.detail}`).join('\n')}\n\n`;
  md += `## All checks\n\n| Result | Area | Check | Detail |\n|---|---|---|---|\n`;
  for (const r of [...results.filter(r => r.status !== 'NOTE'), ...notes]) md += `| ${icon(r.status)} | ${esc(r.area)} | ${esc(r.check)} | ${esc(r.detail)} |\n`;
  md += `\n## Screenshots\n\nIn \`screenshots/\` (desktop 1440 px, mobile 390 px, dark mode):\n\n${shots.map(s => `- [${s}](screenshots/${s})`).join('\n')}\n\n`;
  md += `## Other artifacts\n\nLighthouse HTML/JSON (\`lighthouse-mobile.report.*\`), axe-core JSON per page (\`axe-*.json\`), raw logs of the functional scripts (\`log-*.txt\`), \`results.json\`.\n`;
  writeFileSync(path.join(OUT, 'report.md'), md);
  writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, verdict, started: new Date(T0).toISOString(), runtime_ms: ms, results: [...results, ...notes.filter(n => !results.includes(n))] }, null, 1));
  console.log(`\n==== ${verdict} ==== ${results.filter(r => r.status === 'PASS').length} pass, ${fails.length} fail, ${warns.length} warn — ${Math.floor(ms / 60000)}m ${Math.round(ms / 1000) % 60}s\nReport: ${path.join(OUT, 'report.md')}`);
  for (const f of fails) console.log('BLOCKER:', `[${f.area}] ${f.check} — ${f.detail.slice(0, 200)}`);
  return verdict;
}
import { readdirSync } from 'node:fs';
function readdirSafe(d) { return readdirSync(d).sort(); }

// ---------------- main ----------------
log(`Launch check against ${BASE} → ${OUT}`);
await discover();
log(`demo ids: human ${demo.human}, agent ${demo.agent}, intro ${demo.intro}`);
await httpChecks();
// Functional group 1 runs first (needs 5 sign-ups from this IP; the site allows 5 per 10-min window), then its accounts are deleted
// so the screenshots/labels are taken against the clean demo data. Group 2 runs after the browser phase in the next window.
const roomNow = () => { const w = Math.floor(Date.now() / 600000); return w !== otpWindow ? 5 : 5 - otpStartsUsed; };
const browserPhase = async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try { await browserChecks(browser); } catch (e) { add('5 Visual', 'Browser checks crashed', 'FAIL', e.stack?.slice(0, 400)); }
  try { await lighthouse(browser); } catch (e) { add('7 Performance', 'Lighthouse crashed', 'WARN', e.message); }
  await browser.close();
};
const group1 = async () => { await e2e(); await mcpCheck(); await cleanup('after-e2e'); };
if (SKIP_FLOWS) await browserPhase();
else if (roomNow() >= 5) { await group1(); await browserPhase(); }          // clean screenshots; window gap overlaps the browser phase
else { log('sign-up window partly used — running browser checks first'); await browserPhase(); await group1(); }
if (!SKIP_FLOWS) { await twoHumans(); await rateTest(); await cleanup('final'); }
await verifyCounts();
const verdict = report();
process.exit(verdict === 'GO' ? 0 : 1);
