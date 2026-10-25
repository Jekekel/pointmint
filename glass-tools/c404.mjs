import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const p = await b.newPage(); p.on("console", m => { if (m.type() === "error") console.log("ERR:", m.text(), m.location().url); });
await p.goto("https://agents.pointmint.io/nope-" + Date.now()); await p.waitForTimeout(2500); await b.close();
