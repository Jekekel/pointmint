import { chromium, webkit } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base, out, w = "1024", path = "/", eng = "chromium", h = ""] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = eng === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: +w, height: +(h || Math.round(w * 0.66)) } });
const p = await ctx.newPage();
if (process.env.VIEW) await p.addInitScript(v => localStorage.setItem('pm-view', v), process.env.VIEW);
await p.goto(base + path, { waitUntil: "load" }); await p.waitForTimeout(2000);
const H = await p.evaluate(() => document.documentElement.scrollHeight), vh = await p.evaluate(() => innerHeight);
const stops = [0, 0.33, 0.66, 1].map(f => Math.round((H - vh) * f));
for (const [i, y] of stops.entries()) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/${eng}-${w}-s${i}.png` }); }
console.log('H', H, 'class', await p.evaluate(() => document.documentElement.className));
await b.close();
