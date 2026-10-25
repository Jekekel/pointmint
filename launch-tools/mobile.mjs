import { webkit, devices } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base, out, path = "/", tag = "home"] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await webkit.launch(); const ctx = await b.newContext({ ...devices["iPhone 14 Pro"] }); const p = await ctx.newPage();
await p.goto(base + path, { waitUntil: "load" }); await p.waitForTimeout(1800);
await p.screenshot({ path: `${out}/mobile-${tag}-human.png` });
await p.click('#tab-agent'); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/mobile-${tag}-agent.png` });
const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); console.log('overflow', ov);
await b.close();
