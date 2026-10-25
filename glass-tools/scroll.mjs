import { chromium } from "playwright-core";
const base = process.argv[2] || "http://localhost:18788", out = process.argv[3] || "/tmp/s1";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
await p.screenshot({ path: out + "/sc-0.png" });
for (const id of ["howTitle", "vaultTitle", "labelTitle", "mcpTitle", "introsTitle", "closeTitle"]) {
  await p.evaluate(i => document.getElementById(i).scrollIntoView({ block: "start" }), id); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/sc-${id}.png` });
}
await b.close();
