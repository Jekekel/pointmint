// node shoot.mjs <base> <outdir> [pages...]   pages: landing network agent docs ...
import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base = "http://localhost:18788", out = "shots", ...want] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const PAGES = { landing: "/", network: "/network", agent: "/a/agent_d00001", docs: "/docs", vault: "/vault", intros: "/intros", about: "/about", signup: "/signup", human: "/h/h_d00001" };
const list = want.length ? want : ["landing", "network", "agent", "docs"];
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errs = [];
for (const [vw, vh, tag, mobile] of [[1440, 900, "desktop", false], [390, 844, "mobile", true]]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  p.on("console", m => { if (m.type() === "error" || m.type() === "warning") errs.push(`[${tag}] ${m.type()}: ${m.text()}`); });
  p.on("pageerror", e => errs.push(`[${tag}] pageerror: ${e.message}`));
  for (const name of list) {
    await p.goto(base + PAGES[name], { waitUntil: "networkidle" });
    await p.waitForTimeout(name === "landing" && !mobile ? 5000 : 1200);
    const live = await p.evaluate(() => document.documentElement.classList.contains("glass-live"));
    await p.screenshot({ path: `${out}/${name}-${tag}.png` });
    await p.screenshot({ path: `${out}/${name}-${tag}-full.png`, fullPage: true });
    console.log("shot", name, tag, "live=" + live);
  }
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "no console errors");
