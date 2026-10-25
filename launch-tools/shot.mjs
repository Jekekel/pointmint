// node shot.mjs <base> <outfile.png> <w> <h> <path> [waitMs] [mobile]
import { chromium } from "playwright-core";
const [base, out, w = "1440", h = "900", path = "/", wait = "3500", mobile = ""] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: mobile ? 3 : 1, isMobile: !!mobile, hasTouch: !!mobile });
const p = await ctx.newPage(); const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
await p.goto(base + path, { waitUntil: "load" }); await p.waitForTimeout(+wait);
await p.screenshot({ path: out });
if (process.env.EVAL) console.log(await p.evaluate(process.env.EVAL));
console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
