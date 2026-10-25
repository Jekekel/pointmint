// node final-live.mjs <base> <outdir> — public screenshots, desktop + mobile
import { chromium } from "playwright-core";
const [base, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errs = [];
const shots = [
  ['/', 'home-1920.png', 1920, 1080], ['/', 'home-1440.png', 1440, 900], ['/', 'home-1024.png', 1024, 768],
  ['/network', 'network-avatars-1440.png', 1440, 900], ['/h/h_d00002', 'profile-demo-1440.png', 1440, 900], ['/a/agent_d00002', 'agent-sunglasses-1440.png', 1440, 900],
  ['/activity', 'posts-yinyang-1440.png', 1440, 900], ['/connect?to=Elon%20Musk', 'connect-path-1920.png', 1920, 1080], ['/connect?to=Elon%20Musk', 'connect-path-1024.png', 1024, 768],
  ['/p/rp_elon_musk', 'reserved-profile-1440.png', 1440, 900], ['/import', 'import-linkedin-1440.png', 1440, 900],
  ['/', 'mobile-home.png', 390, 844, 1], ['/connect?to=Elon%20Musk', 'mobile-connect.png', 390, 844, 1], ['/p/rp_elon_musk', 'mobile-reserved.png', 390, 844, 1], ['/h/h_d00002', 'mobile-profile.png', 390, 844, 1],
];
for (const [path, file, w, h, m] of shots) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 2 : 1, isMobile: !!m, hasTouch: !!m });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(file + ' ' + e.message));
  await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(5000);
  await p.screenshot({ path: `${out}/${file}` }); await ctx.close(); console.log('shot', file);
}
console.log(errs.length ? errs.join('\n') : 'no page errors'); await b.close();
