import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
for (const path of ['/vault', '/intros', '/vault']) { const p = await ctx.newPage(); await p.goto('https://agents.pointmint.io' + path, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const t = Date.now(); await p.screenshot({ path: '/tmp/fp.png', fullPage: true, timeout: 60000 }).catch(e => console.log('ERR', e.message.slice(0, 80))); console.log(path, Date.now() - t, 'ms', await p.evaluate(() => document.documentElement.scrollHeight)); await p.close(); }
await b.close();
