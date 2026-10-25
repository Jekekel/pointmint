// Real browser photo flow: sign up (simulated SMS), onboarding photo step via file upload, then screenshots.
import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base, out, file, name = 'Photo Tester (test account)'] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage(); const errs = [];
p.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); }); p.on("pageerror", e => errs.push(e.message));
await p.goto(base + '/signup', { waitUntil: 'load' });
const phone = '+1 555 ' + (100 + Math.floor(Math.random() * 900)) + ' ' + (1000 + Math.floor(Math.random() * 9000));
await p.fill('#phone', phone); await p.click('#startForm button');
await p.waitForSelector('#demoCode'); const code = await p.textContent('#demoCode');
await p.fill('#otp', code.trim()); await p.fill('#vname', name); await p.fill('#vhead', 'Founder, PointMint (test account)');
await p.click('#verifyForm button');
await p.waitForSelector('#photo'); await p.waitForTimeout(400);
await p.screenshot({ path: `${out}/onboarding-photo-step.png` });
if (process.env.SKIP) { await p.click('text=Skip for now'); await p.waitForSelector('.nag'); await p.waitForTimeout(600); await p.screenshot({ path: `${out}/dashboard-nag.png` }); }
else { await p.setInputFiles('#photoFile', file); await p.waitForSelector('.photo-panel:not(.missing)', { timeout: 15000 }); await p.waitForTimeout(800); await p.screenshot({ path: `${out}/dashboard-with-photo.png` }); }
const me = await p.evaluate(() => fetch('/api/me').then(r => r.json()));
// mint an agent so the right column has one
await p.evaluate(() => fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Tester’s agent', provider: 'Claude' }) }));
await p.evaluate(() => fetch('/api/vault', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'buy', title: 'Buying three commercial espresso machines', tags: 'coffee, equipment, espresso', visibility: 'public', budget_min: 8000, budget_max: 36000 }) }));
for (const w of [1440, 1024]) { await p.setViewportSize({ width: w, height: Math.round(w * 0.62) }); await p.goto(base + '/h/' + me.human.id, { waitUntil: 'load' }); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/profile-${process.env.SKIP ? 'no-photo' : 'photo'}-${w}.png` }); }
await p.goto(base + '/network', { waitUntil: 'load' }); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/network-${process.env.SKIP ? 'no-photo' : 'photo'}.png` });
console.log(JSON.stringify({ id: me.human.id, has_photo: me.human.has_photo, src: me.human.photo_source, errs }));
await b.close();
