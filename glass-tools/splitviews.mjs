import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base = "http://localhost:8787", out = "tmp/split"] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; p.on("console", m => { if (m.type() === "error") errs.push(m.text()); }); p.on("pageerror", e => errs.push(e.message));
await p.goto(base + "/h/h_d00001", { waitUntil: "networkidle" }); await p.waitForTimeout(600);
// scroll agent column to connectors + composer
await p.evaluate(() => { const t = document.getElementById('termBody'); t.scrollTop = t.scrollHeight - t.clientHeight - 600; });
await p.screenshot({ path: `${out}/v-agent-scrolled.png` });
await p.evaluate(() => { const t = document.getElementById('termBody'); t.scrollTop = t.scrollHeight; });
await p.screenshot({ path: `${out}/v-agent-bottom.png` });
// drag divider
const d = await p.locator('#divider').boundingBox();
await p.mouse.move(d.x + d.width / 2, d.y + 200); await p.mouse.down(); await p.mouse.move(d.x - 260, d.y + 200, { steps: 12 }); await p.mouse.up();
await p.waitForTimeout(400); await p.screenshot({ path: `${out}/v-dragged.png` });
console.log('ratio', await p.evaluate(() => [document.getElementById('divider').getAttribute('aria-valuenow'), localStorage.getItem('pm-split')]));
// keyboard
await p.focus('#divider'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowRight');
console.log('after keys', await p.evaluate(() => document.getElementById('divider').getAttribute('aria-valuenow')));
await p.keyboard.press('Enter');
await p.click('[data-viewbtn="agent"]'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/v-agentonly.png` });
await p.click('[data-viewbtn="human"]'); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/v-humanonly.png` });
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/v-home-humanonly.png` });
await p.click('[data-viewbtn="split"]'); await p.waitForTimeout(500);
console.log(errs.join('\n') || 'no errors');
await b.close();
