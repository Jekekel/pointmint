// node youdot.mjs <base> <outdir> [suffix] — you-dot checks + screenshots at 1440 desktop and 390 mobile
import { chromium } from "playwright-core";
const [base, out, suf = ""] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const info = p => p.evaluate(() => { const d = document.getElementById('youDot'), r = d && d.querySelector('.yd-core').getBoundingClientRect(), y = PMGraph.you();
  return { has: !!d, off: d && d.classList.contains('off'), lift: d && d.classList.contains('lift'), x: r && r.left + r.width / 2, y: r && r.top + r.height / 2, w: r && r.width, guest: !!y && y.id === 'you:guest', id: y && y.id, pin: y && y.pin, follow: PMGraph.G.follow, anim: d && getComputedStyle(d.querySelector('.yd-halo')).animationName,
    app: (() => { const a = document.getElementById('app').getBoundingClientRect(); return [a.left, a.top, a.right, a.bottom]; })(), L: document.getElementById('colL').getBoundingClientRect().right, R: document.getElementById('colR').getBoundingClientRect().left, deckTop: document.getElementById('deck').getBoundingClientRect().top }; });
// headless software rendering is slow: poll until the dot stops moving (max 8 s)
// (desktop frames take ~1 s each under headless SwiftShader, so poll until a condition holds, max 25 s)
async function until(p, cond) { let a; for (let n = 0; n < 50; n++) { a = await info(p); if (cond(a)) return a; await p.waitForTimeout(500); } return a; }
async function run(name, opts, fn) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/cloudflareinsights|Content Security/.test(m.text())) errs.push(m.text()); });
  await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForFunction(() => window.PMGraph && PMGraph.G.ready, null, { timeout: 15000 }); await p.waitForTimeout(2500);
  await fn(p); ok(!errs.length, `${name}: no page errors ${errs.join(' | ')}`); await ctx.close();
}
await run('desktop', { viewport: { width: 1440, height: 900 } }, async p => {
  let i = await info(p); console.log(JSON.stringify(i));
  ok(i.has && i.guest && i.pin, 'desktop: visitor gets a pinned You guest node + dot'); ok(i.w >= 20, 'desktop: dot core >= 20px (' + i.w + ')');
  ok(i.anim === 'ydPulse', 'desktop: halo pulse animation');
  ok(!i.off && !i.lift, `desktop docked: dot stays behind the glass (lift=${i.lift})`);
  // panel covers the centre: the glass should sit over the dot (higher z-index)
  const over = await p.evaluate(() => { const d = document.getElementById('youDot'), a = document.getElementById('app'); if (!d || !a) return null; const r = d.querySelector('.yd-core').getBoundingClientRect(), c = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(c && (a.contains(c) || a === c)); });
  ok(over === true, 'desktop docked: elementFromPoint hits the middle panel, not the you-dot');
  await p.screenshot({ path: `${out}/desktop-home${suf}.png` });
  // collapse panel -> dot in the clear centre between the columns
  await p.click('[data-action="fp-toggle"]'); await p.waitForTimeout(800); i = await until(p, b => !b.lift);
  ok(!i.off && !i.lift && Math.abs(i.x - (i.L + i.R) / 2) < 30, `desktop collapsed: dot centred between columns (x=${i.x}, mid=${(i.L + i.R) / 2})`);
  await p.screenshot({ path: `${out}/desktop-collapsed${suf}.png` });
  // pan away, then Find me
  await p.mouse.move((i.L + i.R) / 2 + 250, 650); await p.mouse.wheel(0, -500); await p.waitForTimeout(300);   // zoom in around a point away from you
  const moved = await until(p, b => Math.abs(b.x - i.x) > 100); ok(Math.abs(moved.x - i.x) > 100 && !moved.follow, 'desktop: zooming elsewhere moves the dot away and leaves follow mode');
  await p.click('[data-action="graph-findme"]'); await p.waitForTimeout(400); const back = await until(p, b => Math.abs(b.x - i.x) < 12 && Math.abs(b.y - i.y) < 12);
  ok(Math.abs(back.x - i.x) < 12 && Math.abs(back.y - i.y) < 12, `desktop: Find me recentres (${back.x},${back.y} vs ${i.x},${i.y})`);
  // expand, drag panel to the left -> dot should land in the clear space, not under the panel
  await p.click('#fpPill'); await p.waitForTimeout(500);
  await p.focus('#fpGrip'); for (let n = 0; n < 4; n++) await p.keyboard.press('Shift+ArrowLeft');   // float the panel 256px to the left (keyboard move)
  await p.waitForTimeout(800);
  i = await until(p, b => !(b.x > b.app[0] && b.x < b.app[2] && b.y > b.app[1] && b.y < b.app[3])); const [ax0, ay0, ax1, ay1] = i.app; const under = i.x > ax0 && i.x < ax1 && i.y > ay0 && i.y < ay1;
  ok(!under, `desktop floating: dot not under the floating panel (dot ${Math.round(i.x)},${Math.round(i.y)} panel ${i.app.map(Math.round)})`);
  await p.screenshot({ path: `${out}/desktop-floating${suf}.png` });
  await p.keyboard.press('Home').catch(() => {}); await p.evaluate(() => localStorage.removeItem('pm-fp-v1'));
});
await run('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, async p => {
  const i = await info(p); console.log(JSON.stringify(i));
  ok(i.has && !i.off, 'mobile: dot visible'); ok(i.y < i.deckTop - 20 && i.y > 120, `mobile: dot above the sheet (y=${i.y}, sheet ${i.deckTop})`); ok(Math.abs(i.x - 195) < 6, 'mobile: dot horizontally centred');
  await p.screenshot({ path: `${out}/mobile-home${suf}.png` });
  // the graph sleeps on phones: count rAF callbacks the graph schedules over 2 s (should be ~0)
  const frames = await p.evaluate(() => new Promise(r => { let n = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = f => { n++; return o(f); }; setTimeout(() => { window.requestAnimationFrame = o; r(n); }, 2000); }));
  ok(frames <= 2, `mobile: frame loop asleep while the dot pulses (rAF calls in 2 s: ${frames})`);
});
await run('reduced-motion', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }, async p => {
  const i = await info(p); ok(i.anim === 'none', 'reduced motion: no pulse animation (static glow)');
});
console.log(fails ? `${fails} FAILED` : 'ALL PASS'); await b.close(); process.exit(fails ? 1 : 0);
