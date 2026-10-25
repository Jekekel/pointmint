// node final-video.mjs <base> <outdir> — records graph motion, columns popping in, and a connection path lighting up
import { chromium } from "playwright-core"; import { readdirSync, renameSync } from "node:fs";
const [base, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: out + "/raw", size: { width: 1920, height: 1080 } } });
const p = await ctx.newPage();
await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(6000);
await p.click('#cxq'); await p.keyboard.type('Elon Musk', { delay: 90 }); await p.waitForTimeout(500);
await p.keyboard.press('Enter'); await p.waitForTimeout(7000);
await p.click('[data-action="cx-path"][data-i="1"]').catch(() => {}); await p.waitForTimeout(4000);
await p.evaluate(() => { history.pushState({}, '', '/connect?to=Patrick%20Collison'); dispatchEvent(new PopStateEvent('popstate')); }); await p.waitForTimeout(6000);
await ctx.close(); await b.close();
const f = readdirSync(out + '/raw').filter(x => x.endsWith('.webm'))[0]; renameSync(`${out}/raw/${f}`, `${out}/raw/demo.webm`); console.log('ok');
