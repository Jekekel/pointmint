import { chromium, webkit } from "playwright-core"; import { mkdirSync } from "node:fs";
const [base = "https://agents.pointmint.io", out = "/tmp/repro", widths = "1024"] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const engines = (process.env.ENGINES || "webkit,chromium").split(",");
for (const eng of engines) {
  const b = eng === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  for (const w of widths.split(",").map(Number)) for (const scheme of (process.env.SCHEMES || "dark").split(",")) {
    const ctx = await b.newContext({ viewport: { width: w, height: Math.round(w * 0.62) }, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on("console", m => { if (m.type() === "error" && !/cloudflareinsights|beacon/.test(m.text())) errs.push(m.text().slice(0, 140)); }); p.on("pageerror", e => errs.push(e.message));
    await p.goto(base + (process.env.PATHNAME || "/"), { waitUntil: "load" });
    if (process.env.THEME) { await p.evaluate(t => localStorage.setItem('pm-theme', t), process.env.THEME); await p.reload({ waitUntil: "load" }); }
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => ({ live: document.documentElement.className, gl: (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })(), h: document.documentElement.scrollHeight, view: document.getElementById('split')?.dataset.view }));
    const tag = `${eng}-${w}-${scheme}`;
    await p.screenshot({ path: `${out}/${tag}.png` });
    await p.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
    console.log(tag, JSON.stringify(info), errs.join(' | '));
    await ctx.close();
  }
  await b.close();
}
