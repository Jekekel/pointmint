// Records the graph background with the columns popping in and a node click loading a person. node graphvideo.mjs <base> <outdir> [w] [h]
import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base, out, w = "1920", h = "1080"] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, recordVideo: { dir: out, size: { width: +w, height: +h } } });
const p = await ctx.newPage();
await p.addInitScript(() => { localStorage.setItem('pm-rail-l', 'rail'); localStorage.setItem('pm-rail-r', 'rail'); });
await p.goto(base + "/", { waitUntil: "load" });
await p.waitForTimeout(2600);
// columns pop in
await p.click('#colL .rail'); await p.waitForTimeout(500); await p.click('#colR .rail'); await p.waitForTimeout(1800);
// find a visible human node in a gap between the columns
const pick = async (avoid) => p.evaluate((avoid) => {
  const G = PMGraph.G, W = innerWidth, H = innerHeight, cam = G.cam;
  const rects = ['colL', 'app', 'colR', 'hud'].map(id => document.getElementById(id).getBoundingClientRect());
  const free = (x, y) => !rects.some(r => x > r.left - 12 && x < r.right + 12 && y > r.top - 12 && y < r.bottom + 12);
  const c = G.nodes.filter(n => n.type === 'human' && n.id !== avoid).map(n => ({ n, x: (n.x - cam.x) * cam.k + W / 2, y: (n.y - cam.y) * cam.k + H / 2 })).filter(o => o.x > 20 && o.y > 70 && o.x < W - 20 && o.y < H - 20 && free(o.x, o.y));
  c.sort((a, b) => b.n.deg - a.n.deg); return c[0] ? { id: c[0].n.id, x: c[0].x, y: c[0].y } : null;
}, avoid);
let t = await pick();
if (t) { await p.mouse.move(t.x - 120, t.y - 60); await p.mouse.move(t.x, t.y, { steps: 25 }); await p.waitForTimeout(1400); await p.mouse.click(t.x, t.y); await p.waitForTimeout(2600); }
// wheel zoom in the gap, then search fly-to
if (t) { for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -120); await p.waitForTimeout(90); } await p.waitForTimeout(900); for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(90); } }
await p.click('#gq'); await p.keyboard.type('Priya', { delay: 90 }); await p.waitForTimeout(600); await p.keyboard.press('Enter'); await p.waitForTimeout(2800);
// collapse both columns to show the whole graph, then open them again
await p.click('.rail-btn[data-rail="l"]'); await p.click('.rail-btn[data-rail="r"]'); await p.waitForTimeout(1200);
await p.click('[data-action="graph-fit"]'); await p.waitForTimeout(1800);
await p.click('#colL .rail'); await p.waitForTimeout(350); await p.click('#colR .rail'); await p.waitForTimeout(2000);
const v = p.video(); await ctx.close(); console.log(await v.path()); await b.close();
