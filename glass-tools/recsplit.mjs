// Hero clip: drag the split divider while the live agent feed fills with REAL MCP calls from a fresh test agent.
// node recsplit.mjs <base> <framesDir>   (prints no credentials)
import { chromium } from "playwright-core"; import { mkdirSync, rmSync, writeFileSync } from "node:fs";
const base = process.argv[2] || "https://agents.pointmint.io", dir = process.argv[3] || "tmp/recsplit", FPS = 30, SECS = 12, W = 1440, H = 900;
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.on("console", m => { if (m.type() === "error" && !/cloudflareinsights/.test(m.text())) console.log("console error:", m.text()); });
await p.goto(base + "/docs", { waitUntil: "networkidle" });
// fresh test account + agent (simulated SMS); the credential stays in memory only
const tok = await p.evaluate(async () => {
  const j = (u, b) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
  const s = await j('/api/auth/start', { phone: '+1 (555) 4' + String(Math.floor(Math.random() * 90 + 10)) + '-' + String(Math.floor(Math.random() * 9000 + 1000)) });
  await j('/api/auth/verify', { otp_id: s.otp_id, code: s.simulated_sms.code, name: 'Video Tester', headline: 'Hero clip (test account)' });
  return (await j('/api/agent', { name: 'Video Tester agent', provider: 'Claude' })).credential;
});
if (!tok) throw new Error('could not mint test agent');
let rpc = 1;
const mcp = (name, args = {}) => fetch(base + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ jsonrpc: '2.0', id: rpc++, method: 'tools/call', params: { name, arguments: args } }) }).then(r => r.status);
await fetch(base + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + tok }, body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'hero-clip', version: '1' } } }) });
await p.goto(base + "/activity", { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
const cdp = await ctx.newCDPSession(p);
await cdp.send('Animation.enable');
const d0 = await p.locator('#divider').boundingBox(); const sp = await p.locator('#split').boundingBox();
const cy = d0.y + d0.height * 0.42;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const xAt = pct => sp.x + sp.width * pct / 100;
// timeline (video seconds): hold 50% → drag to 34% → hold → drag to 66% → hold → back to 50%
const keys = [[0, 50], [1.2, 50], [3.4, 34], [4.6, 34], [7.4, 66], [8.6, 66], [10.6, 50], [12, 50]];
const pctAt = t => { for (let k = 1; k < keys.length; k++) if (t <= keys[k][0]) { const [t0, a] = keys[k - 1], [t1, z] = keys[k]; return a + (z - a) * ease((t - t0) / (t1 - t0)); } return 50; };
const calls = [['search_matches', { limit: 5 }], ['get_my_vault'], ['list_intros'], ['list_messages', { direction: 'in' }], ['send_message', { to_type: 'agent', to_id: 'agent_d00002', body: 'Hi Marcus-Grok, my human is looking at two-group espresso machines. Are the serviced units still available?' }], ['get_my_profile'], ['search_matches', { limit: 3 }]];
let callIx = 0, lastCall = 0, down = false;
await p.mouse.move(xAt(50), cy);
const t0 = Date.now(); let frameMs = 250;
for (let f = 0; f < FPS * SECS; f++) {
  const t = f / FPS, s = Date.now();
  const pct = pctAt(t);
  if (!down && t >= 1.0) { await p.mouse.move(xAt(50) + 0, cy); await p.mouse.down(); down = true; }
  if (down) await p.mouse.move(xAt(pct), cy + Math.sin(t * 1.3) * 6);
  if (down && t >= 10.8) { await p.mouse.up(); down = false; }
  // real MCP calls, spaced in wall time so the 4 s poll brings them in a few at a time
  if (callIx < calls.length && Date.now() - lastCall > 9000 && t > 0.6) { lastCall = Date.now(); mcp(...calls[callIx++]); }
  await cdp.send('Animation.setPlaybackRate', { playbackRate: Math.max(0.05, Math.min(1, (1000 / FPS) / frameMs)) });
  await p.screenshot({ path: `${dir}/f${String(f).padStart(4, "0")}.png` });
  frameMs = 0.8 * frameMs + 0.2 * (Date.now() - s);
  if (f % 60 === 0) console.log(`frame ${f}/${FPS * SECS}  ${((Date.now() - t0) / 1000).toFixed(0)}s  ${callIx} calls`);
}
console.log('feed lines:', await p.locator('#feed .ev:not(.cur)').count(), 'fresh:', await p.locator('#feed .ev.fresh').count());
await p.evaluate(() => fetch('/api/agent/revoke', { method: 'POST' }));
await b.close();
