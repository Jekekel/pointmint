import { chromium } from "playwright-core";
const base = process.argv[2] || "http://localhost:18788", out = process.argv[3] || "/tmp/s1";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on("console", m => console.log("console:", m.type(), m.text()));
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
await p.evaluate(() => document.getElementById("fuseTitle").scrollIntoView({ block: "start" }));
await p.waitForTimeout(2500);
await p.screenshot({ path: out + "/play-apart.png" });
const a = await p.locator('[data-side="a"]').boundingBox(), bb = await p.locator('[data-side="b"]').boundingBox();
console.log(a, bb);
await p.mouse.move(a.x + a.width / 2, a.y + 40); await p.mouse.down();
for (let i = 1; i <= 30; i++) { await p.mouse.move(a.x + a.width / 2 + (bb.x - a.x - a.width + 6) * i / 30, a.y + 40 + 10 * Math.sin(i / 5)); await p.waitForTimeout(30); }
await p.mouse.up(); await p.waitForTimeout(2500);
console.log("fused=", await p.locator("#glassPlay").getAttribute("data-fused"));
await p.screenshot({ path: out + "/play-fused.png" });
await b.close();
