// node perf/axe.mjs <base> <paths...> — serious/critical axe violations at 1440 and 390
import { createRequire } from 'node:module'; import { readFileSync } from 'node:fs';
const req = createRequire('/workspace/pointmint-agent-network/launch-tools/package.json');
const { chromium } = req('playwright-core'); const AXE = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8');
const [base, ...paths] = process.argv.slice(2); let bad = 0;
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const w of [1440, 390]) { const ctx = await b.newContext({ bypassCSP: true, viewport: { width: w, height: 900 } }); const p = await ctx.newPage();
  for (const r of paths) { await p.goto(base + r, { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(1200); await p.addScriptTag({ content: AXE });
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })).violations.filter(x => ['serious', 'critical'].includes(x.impact)).map(x => x.id + ': ' + x.nodes.slice(0, 3).map(n => n.target.join(' ') + ' ' + (n.any[0]?.message || '').slice(0, 100)).join(' | ')));
    bad += v.length; console.log(w, r, v.length ? v.join('\n   ') : 'ok'); } await ctx.close(); }
await b.close(); process.exit(bad ? 1 : 0);
