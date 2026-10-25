import { webkit, devices } from "playwright-core";
const [base, out] = process.argv.slice(2);
const b = await webkit.launch(); const p = await (await b.newContext({ ...devices["iPhone 14 Pro"] })).newPage();
await p.goto(base + '/', { waitUntil: "load" }); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.stream').scrollIntoView()); await p.waitForTimeout(300);
await p.screenshot({ path: out + '-human.png' });
await p.click('#tab-agent'); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('.stream').scrollIntoView()); await p.waitForTimeout(300);
await p.screenshot({ path: out + '-agent.png' }); await b.close();
