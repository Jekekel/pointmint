import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
p.on("console", m => console.log("console:", m.type(), m.text()));
for (const t of ["lumen", "neon", "entropy"]) {
  await p.goto(`http://localhost:18790/index.html?t=${t}`); await p.waitForTimeout(t === "lumen" ? 6000 : 4000);
  await p.screenshot({ path: `bg-${t}.png` }); console.log("shot", t);
}
await b.close();
