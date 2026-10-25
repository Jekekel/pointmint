// node splitshot.mjs <base> <outdir> [desktop|mobile|both] [pages...]
import { chromium } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base = "http://localhost:8787", out = "tmp/split", mode = "both", ...want] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const PAGES = { home: "/", network: "/network", vault: "/vault", matches: "/matches", intros: "/intros", activity: "/activity", docs: "/docs", human: "/h/h_d00001", agent: "/a/agent_d00001", about: "/about" };
const list = want.length ? want : Object.keys(PAGES);
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errs = [];
const sizes = [[1440, 900, "desktop", false], [390, 844, "mobile", true]].filter(s => mode === "both" || s[2] === mode);
for (const [vw, vh, tag, mobile] of sizes) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  p.on("console", m => { if (m.type() === "error") errs.push(`[${tag}] ${m.text()}`); });
  p.on("pageerror", e => errs.push(`[${tag}] pageerror ${e.message}`));
  p.on("requestfailed", r => errs.push(`[${tag}] failed ${r.url()} ${r.failure()?.errorText}`));
  for (const name of list) {
    await p.goto(base + PAGES[name], { waitUntil: "networkidle" }).catch(e => errs.push(`${name} ${e.message}`));
    await p.waitForTimeout(900);
    if (process.env.TAB === "agent" && mobile) { await p.click("#tab-agent"); await p.waitForTimeout(300); }
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (ov > 0) errs.push(`[${tag}] ${name} overflow ${ov}px`);
    await p.screenshot({ path: `${out}/${tag}-${name}.png` });
  }
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "no errors");
