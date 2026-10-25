import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("https://agents.pointmint.io/", { waitUntil: "networkidle" }); await p.waitForTimeout(6000);
await p.mouse.move(1400, 880); await p.waitForTimeout(3000);
await p.screenshot({ path: "tmp/og-src.png" }); await b.close();
