import { chromium } from "playwright-core";
const [url, js] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(url, { waitUntil: "networkidle" }); await p.waitForTimeout(800);
console.log(JSON.stringify(await p.evaluate(js), null, 1));
await b.close();
