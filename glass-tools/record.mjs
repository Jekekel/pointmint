// Deterministic capture: fake clock, step 1/30 s per frame, screenshot each frame (box has no GPU).
import { chromium } from "playwright-core"; import { mkdirSync, rmSync } from "node:fs";
const base = process.argv[2] || "http://localhost:18788", dir = process.argv[3] || "frames", FPS = 30, SECS = +(process.argv[4] || 8);
const W = 1440, H = 900;
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: W, height: H } });
p.on("console", m => { if (m.type() === "error") console.log("console error:", m.text()); });
await p.addInitScript(() => {
  let vt = 1000; let id = 0; let q = new Map();
  performance.now = () => vt;
  window.requestAnimationFrame = cb => { q.set(++id, cb); return id; };
  window.cancelAnimationFrame = i => q.delete(i);
  window.__step = ms => { vt += ms; const list = [...q.values()]; q = new Map(); for (const cb of list) { try { cb(vt); } catch (e) { console.error(e); } } };
});
await p.goto(base + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500); for (let i = 0; i < 12; i++) await p.evaluate(() => __step(33.33)); // settle
let f = 0; const total = FPS * SECS;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let cards = null, playTop = null;
const startY = 0;
async function step(i) {
  const t = i / FPS;
  // 0-2.6s: pointer glides across the hero (pull + drop); pulse at 1.6s
  if (t < 2.6) { const k = t / 2.6; await p.mouse.move(180 + 1050 * ease(k), 260 + 180 * Math.sin(k * Math.PI)); }
  if (i === Math.round(1.6 * FPS)) { await p.mouse.move(1250, 640); await p.mouse.down(); await p.mouse.up(); }
  // 2.6-3.6s: scroll to the intro playground
  if (t >= 2.6 && t < 3.6) {
    if (playTop == null) playTop = await p.evaluate(() => document.getElementById("fuseTitle").getBoundingClientRect().top + scrollY - 70);
    await p.evaluate(y => scrollTo(0, y), Math.round(playTop * ease((t - 2.6) / 1)));
  }
  if (t >= 3.6 && !cards) {
    await p.evaluate(y => scrollTo(0, y), Math.round(playTop));
    const a = await p.locator('[data-side="a"]').boundingBox(), c = await p.locator('[data-side="b"]').boundingBox();
    cards = { ax: a.x + a.width / 2, ay: a.y + 60, dx: c.x - (a.x + a.width) + 4 };
    await p.mouse.move(cards.ax, cards.ay);
  }
  // 3.9s: grab card A, 3.9-6.0 drag right in an arc into card B, release
  if (cards) {
    if (Math.abs(t - 3.9) < 0.5 / FPS) await p.mouse.down();
    if (t > 3.9 && t <= 6.0) { const k = ease((t - 3.9) / 2.1); await p.mouse.move(cards.ax + cards.dx * k, cards.ay - 50 * Math.sin(k * Math.PI)); }
    if (Math.abs(t - 6.0) < 0.5 / FPS) await p.mouse.up();
    if (t > 6.1) await p.mouse.move(cards.ax + cards.dx + 200 * ((t - 6.1) / 2), cards.ay + 260);
  }
}
const t0 = Date.now();
for (; f < total; f++) {
  await step(f);
  await p.evaluate(ms => __step(ms), 1000 / FPS);
  await p.screenshot({ path: `${dir}/f${String(f).padStart(4, "0")}.png` });
  if (f % 30 === 0) console.log(`frame ${f}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
console.log("fused:", await p.locator("#glassPlay").getAttribute("data-fused"));
await b.close();
