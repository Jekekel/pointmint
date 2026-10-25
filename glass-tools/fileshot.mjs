import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" }); const p = await b.newPage({ viewport: { width: 900, height: 360 } });
await p.goto('file://' + process.argv[2]); await p.screenshot({ path: process.argv[3] }); await b.close();
