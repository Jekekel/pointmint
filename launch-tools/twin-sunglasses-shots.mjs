import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const BASE = (process.argv[2] || 'https://agents.pointmint.io').replace(/\/$/, '');
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots', 'twin-sunglasses');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function fetchBuf(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ' ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

// 1) Direct SVG pages (same-origin navigation — CORP ok)
const page = await browser.newPage({ viewport: { width: 720, height: 720 } });
for (const [name, path] of [
  ['twin-placeholder.svg.png', '/avatars/twin-placeholder.svg'],
  ['twin-agent-host.svg.png', '/avatars/twin/agent_host.svg'],
  ['legacy-synthetic-host.svg.png', '/avatars/agent_host.svg'],
]) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, name) });
  console.log('wrote', name, 'status ok');
}

// 2) UI shots on site
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: join(OUT, 'desktop-home-1440.png') });
await page.goto(BASE + '/network', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: join(OUT, 'desktop-network-1440.png') });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: join(OUT, 'mobile-home-390.png') });
console.log('wrote UI shots');

// 3) Create account + photo + compose comparison via data URIs (bypass CORP)
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p2 = await ctx.newPage();
const phone = '+1 (555) ' + String(100 + Math.floor(Math.random()*900)) + '-' + String(1000 + Math.floor(Math.random()*9000));
let r = await p2.request.post(BASE + '/api/auth/start', { data: { phone }, headers: { origin: BASE } });
let j = await r.json();
r = await p2.request.post(BASE + '/api/auth/verify', { data: { otp_id: j.otp_id, code: j.simulated_sms.code, name: 'Twin Shot', headline: 'Twin sunglasses screenshot' }, headers: { origin: BASE } });
await r.json();
r = await p2.request.post(BASE + '/api/agent', { data: { name: "Twin Shot's agent", provider: 'Grok' }, headers: { origin: BASE } });
await r.json();
const jpg = readFileSync(new URL('../prototype/scripts/fixtures/face-exif.jpg', import.meta.url));
r = await p2.request.post(BASE + '/api/me/photo', { data: jpg, headers: { origin: BASE, 'content-type': 'image/jpeg', 'x-photo-source': 'upload' } });
console.log('photo', r.status());
const me = await (await p2.request.get(BASE + '/api/me')).json();
const agentId = me.agent.id;
const humanId = me.human.id;

// fetch via request (same cookies / ok) then inline
const photoBuf = await p2.request.get(BASE + me.human.photo_url).then(x => x.body());
const twinBuf = await p2.request.get(BASE + `/avatars/twin/${agentId}.svg`).then(x => x.body());
const photoB64 = photoBuf.toString('base64');
const twinB64 = twinBuf.toString('base64');
const twinText = twinBuf.toString('utf8');
console.log('twin has sunglasses', /sunglasses/i.test(twinText), 'has data uri', /data:image/.test(twinText), 'bytes', twinBuf.length);

await p2.setContent(`<!doctype html><html><body style="margin:0;background:#0b1020;display:flex;gap:48px;align-items:center;justify-content:center;min-height:100vh;font:14px system-ui;color:#cfe">
  <figure style="text-align:center;margin:0"><img src="data:image/jpeg;base64,${photoB64}" width="220" height="220" style="border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px #ffb47a88"/><figcaption style="margin-top:12px">Human photo</figcaption></figure>
  <figure style="text-align:center;margin:0"><img src="data:image/svg+xml;base64,${twinB64}" width="220" height="220" style="border-radius:40px;box-shadow:0 0 0 3px #93a9ff88"/><figcaption style="margin-top:12px">Twin = photo + sunglasses</figcaption></figure>
</body></html>`, { waitUntil: 'load' });
await p2.waitForTimeout(500);
await p2.screenshot({ path: join(OUT, 'human-vs-twin-compose.png') });
console.log('wrote human-vs-twin-compose.png');

await p2.goto(BASE + '/h/' + humanId, { waitUntil: 'networkidle', timeout: 60000 });
await p2.waitForTimeout(1200);
await p2.screenshot({ path: join(OUT, 'desktop-profile-twin-1440.png') });
console.log('wrote desktop-profile-twin-1440.png');

// Mel dash (owner AI column) — may need expand rail
await p2.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await p2.waitForTimeout(1000);
const mel = await p2.$('#melDash, .mel-dash');
if (mel) {
  await mel.scrollIntoViewIfNeeded();
  await p2.waitForTimeout(400);
  await mel.screenshot({ path: join(OUT, 'mel-dash-twin.png') });
  console.log('wrote mel-dash-twin.png');
} else {
  // try expand agent column
  const btn = await p2.$('[data-rail="r"], .rail[aria-controls="colR"]');
  if (btn) { await btn.click(); await p2.waitForTimeout(800); }
  const mel2 = await p2.$('#melDash, .mel-dash');
  if (mel2) { await mel2.screenshot({ path: join(OUT, 'mel-dash-twin.png') }); console.log('wrote mel-dash-twin.png'); }
  else { await p2.screenshot({ path: join(OUT, 'mel-dash-twin.png') }); console.log('wrote full page fallback mel-dash-twin.png'); }
}

await p2.request.delete(BASE + '/api/me/photo', { headers: { origin: BASE } }).catch(()=>{});
await browser.close();
writeFileSync(join(OUT, 'README.txt'), `Twin sunglasses screenshots\nBase: ${BASE}\nAt: ${new Date().toISOString()}\nAgent: ${agentId}\nHuman: ${humanId}\n`);
console.log('done');
