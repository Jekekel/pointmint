import { chromium } from "playwright-core";
const base = process.argv[2] || "http://localhost:18788", out = process.argv[3] || "/tmp/s1";
const exe = "/usr/bin/google-chrome", gl = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const errs = [];
const watch = (p, tag) => { p.on("console", m => { if (["error", "warning"].includes(m.type())) errs.push(`[${tag}] ${m.text()}`); }); p.on("pageerror", e => errs.push(`[${tag}] pageerror ${e.message}`)); };
// 1. theme switch + pulse + fps (live)
let b = await chromium.launch({ executablePath: exe, args: gl });
let p = await b.newPage({ viewport: { width: 1440, height: 900 } }); watch(p, "live");
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
const fps = await p.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
console.log("rAF fps (swiftshader CPU):", fps.toFixed(1));
await p.mouse.click(1300, 600); await p.waitForTimeout(250); await p.screenshot({ path: out + "/pulse.png" });
await p.click('[data-theme-pick="neon"]'); await p.waitForTimeout(2500); await p.screenshot({ path: out + "/theme-neon.png" });
await p.click('[data-theme-pick="entropy"]'); await p.waitForTimeout(2500); await p.screenshot({ path: out + "/theme-entropy.png" });
await p.click('[data-theme-pick="lumen"]'); await p.waitForTimeout(500);
// SPA nav away and back
await p.click('#navLinks a[href="/network"]'); await p.waitForTimeout(800);
console.log("after nav canvas count:", await p.evaluate(() => document.querySelectorAll("canvas").length), "live:", await p.evaluate(() => document.documentElement.classList.contains("glass-live")));
await p.click('.brand'); await p.waitForTimeout(2500);
console.log("back home canvas:", await p.evaluate(() => document.querySelectorAll("canvas").length), "live:", await p.evaluate(() => document.documentElement.classList.contains("glass-live")));
await b.close();
// 2. no WebGL desktop
b = await chromium.launch({ executablePath: exe, args: ["--disable-3d-apis", "--disable-webgl"] });
p = await b.newPage({ viewport: { width: 1440, height: 900 } }); watch(p, "nogl");
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
console.log("nogl live:", await p.evaluate(() => document.documentElement.classList.contains("glass-live")));
await p.screenshot({ path: out + "/nogl-desktop.png" });
await b.close();
// 3. reduced motion desktop
b = await chromium.launch({ executablePath: exe, args: gl });
p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }); watch(p, "rm");
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
console.log("reduced live:", await p.evaluate(() => document.documentElement.classList.contains("glass-live")), "video paused:", await p.evaluate(() => document.querySelector(".twin-video").paused));
await p.evaluate(() => document.getElementById("fuseTitle").scrollIntoView()); await p.waitForTimeout(500);
await p.screenshot({ path: out + "/reduced-play.png" });
await b.close();
console.log(errs.length ? errs.join("\n") : "no console errors/warnings");
