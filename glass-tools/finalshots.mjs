import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const base = "https://agents.pointmint.io", out = "/workspace/pointmint-agent-network/screenshots/split"; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errs = [];
{ const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  for (const [name, path] of [["desktop-split-home", "/"], ["desktop-split-profile", "/h/h_d00001"], ["desktop-split-activity", "/activity"], ["desktop-split-docs", "/docs"], ["desktop-split-intros", "/intros"]]) {
    await p.goto(base + path, { waitUntil: "networkidle" }); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/${name}.png` }); }
  await p.goto(base + "/h/h_d00001", { waitUntil: "networkidle" }); await p.waitForTimeout(800);
  const d = await p.locator('#divider').boundingBox();
  await p.mouse.move(d.x + d.width / 2, d.y + 300); await p.mouse.down(); await p.mouse.move(d.x - 290, d.y + 300, { steps: 16 }); await p.mouse.up(); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/desktop-dragged-30-70.png` });
  const d2 = await p.locator('#divider').boundingBox();
  await p.mouse.move(d2.x + d2.width / 2, d2.y + 300); await p.mouse.down(); await p.mouse.move(d2.x + 580, d2.y + 300, { steps: 16 }); await p.mouse.up(); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/desktop-dragged-70-30.png` });
  console.log('ratio', await p.evaluate(() => document.getElementById('divider').getAttribute('aria-valuenow')));
  await p.click('[data-viewbtn="agent"]'); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/desktop-agent-view.png` });
  await p.click('[data-viewbtn="split"]'); await p.keyboard.press('Escape'); await p.focus('#divider'); await p.keyboard.press('Enter');
  await ctx.close(); }
{ const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  for (const [name, path] of [["mobile-home-human", "/"], ["mobile-profile-human", "/h/h_d00001"]]) { await p.goto(base + path, { waitUntil: "networkidle" }); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${name}.png` }); }
  await p.tap('#tab-agent'); await p.waitForTimeout(500); await p.screenshot({ path: `${out}/mobile-profile-agent.png` });
  await p.goto(base + "/activity", { waitUntil: "networkidle" }); await p.waitForTimeout(700); await p.tap('#tab-agent'); await p.waitForTimeout(400);
  await p.evaluate(() => document.getElementById('feed')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/mobile-activity-agent-feed.png` });
  await ctx.close(); }
await b.close(); console.log(errs.join('\n') || 'no console errors');
