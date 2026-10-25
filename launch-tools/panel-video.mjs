// node panel-video.mjs <base> <outdir> — records the floating panel: drag, collapse to a pill, drag the pill, expand, Community tab
import { chromium } from "playwright-core"; import { readdirSync, renameSync, mkdirSync } from "node:fs";
const [base, out] = process.argv.slice(2); mkdirSync(out + '/raw', { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await b.newContext({ bypassCSP: true, viewport: { width: 1600, height: 900 }, recordVideo: { dir: out + "/raw", size: { width: 1600, height: 900 } } });
const p = await ctx.newPage();
await p.addInitScript(() => { try { localStorage.removeItem('pm-fp-v1'); } catch {} });
await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
// show a cursor dot so the drag is visible in the video
await p.addStyleTag({ content: '#pmcur{position:fixed;z-index:99;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 0 3px rgba(61,217,193,.6);pointer-events:none;transition:transform .1s}#pmcur.d{transform:scale(.75)}' }).catch(() => {});
await p.evaluate(() => { const d = document.createElement('div'); d.id = 'pmcur'; document.body.appendChild(d); addEventListener('pointermove', e => { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }, true); addEventListener('pointerdown', () => d.classList.add('d'), true); addEventListener('pointerup', () => d.classList.remove('d'), true); }).catch(() => {});
const glide = async (x0, y0, x1, y1, steps = 40) => { await p.mouse.move(x0, y0); await p.waitForTimeout(250); await p.mouse.down(); for (let i = 1; i <= steps; i++) { const t = i / steps, e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await p.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(500); };
const hb = await p.locator('#app .m-head').boundingBox();
const hx = hb.x + hb.width - 150, hy = hb.y + hb.height / 2;
await glide(hx, hy, hx - 330, hy + 150, 50); await p.waitForTimeout(900);              // drag the expanded panel
const hb2 = await p.locator('#app .m-head').boundingBox();
await glide(hb2.x + hb2.width - 150, hb2.y + 24, hb2.x + hb2.width + 160, hb2.y + 60, 40); await p.waitForTimeout(800);
const mn = await p.locator('#app .fp-min').boundingBox(); await p.mouse.move(mn.x + 14, mn.y + 14, { steps: 20 }); await p.waitForTimeout(300);
await p.mouse.click(mn.x + 14, mn.y + 14); await p.waitForTimeout(1500);              // collapse → pill, graph shows through
const pb = await p.locator('#fpPill').boundingBox();
await glide(pb.x + 30, pb.y + 20, 1180, 640, 50); await p.waitForTimeout(1000);         // drag the pill
const pb2 = await p.locator('#fpPill').boundingBox();
await glide(pb2.x + 30, pb2.y + 20, 560, 120, 45); await p.waitForTimeout(800);
const pb3 = await p.locator('#fpPill').boundingBox(); await p.mouse.move(pb3.x + 40, pb3.y + 20, { steps: 10 }); await p.mouse.click(pb3.x + 40, pb3.y + 20); await p.waitForTimeout(1500); // expand where the pill is
await p.click('#app .m-tabs a:has-text("Community")'); await p.waitForTimeout(2200);    // Community tab
await p.click('.cm-card:has-text("p/skills")'); await p.waitForTimeout(2200);
const hb3 = await p.locator('#app .m-head').boundingBox(); await glide(hb3.x + hb3.width - 150, hb3.y + 24, hb3.x + hb3.width - 150 - 200, hb3.y + 10, 40); await p.waitForTimeout(600);
await p.dblclick('#app .m-head .fp-grip').catch(() => {}); await p.waitForTimeout(1800);   // double-click → back to the dock
await ctx.close(); await b.close();
const f = readdirSync(out + '/raw').filter(x => x.endsWith('.webm')).sort().pop(); renameSync(`${out}/raw/${f}`, `${out}/raw/panel.webm`); console.log('ok');
