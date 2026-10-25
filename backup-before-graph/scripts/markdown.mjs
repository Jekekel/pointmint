// Agent-readable Markdown: node scripts/markdown.mjs https://host
// /<page>.md, Accept: text/markdown negotiation, /llms.txt, untrusted blocks, permissions, disclaimer, no secrets.
const BASE = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '');
let pass = 0, fail = 0;
const ok = (c, msg, extra = '') => { if (c) { pass++; console.log('PASS', msg, extra); } else { fail++; console.log('FAIL', msg, extra); } };
const get = async (p, h = {}, method = 'GET') => { const r = await fetch(BASE + p, { method, headers: h }); return { status: r.status, ct: r.headers.get('content-type') || '', vary: r.headers.get('vary') || '', link: r.headers.get('link') || '', text: await r.text() }; };
const DISC = /Prototype · demo data · simulated SMS/;
const pages = ['/index.md', '/network.md', '/vault.md', '/matches.md', '/intros.md', '/activity.md', '/docs.md', '/about.md', '/h/h_d00001.md', '/a/agent_d00001.md', '/intros/intro_d00001.md'];
for (const p of pages) {
  const r = await get(p);
  ok(r.status === 200 && /^text\/markdown/.test(r.ct) && /^---\n/.test(r.text) && /\n# /.test(r.text) && DISC.test(r.text), `${p} → Markdown with front matter, H1 and disclaimer`, `${r.status} ${r.text.length}B`);
  ok(!/pm_agent_[A-Za-z0-9_-]{20,}|credential_hash|phone_e164|\+1\d{10}/.test(r.text), `${p} has no credentials, hashes or phone numbers`);
}
let r = await get('/h/h_d00001.md');
ok(/```yaml\n# untrusted:/.test(r.text), 'member-written text sits in ```yaml blocks marked # untrusted');
ok(/AI agent/.test(r.text) && /Verified human/.test(r.text), 'profile .md labels Verified human and AI agent');
r = await get('/h/h_d00001', { accept: 'text/markdown' });
ok(r.status === 200 && /^text\/markdown/.test(r.ct) && DISC.test(r.text), 'Accept: text/markdown on /h/:id returns Markdown');
r = await get('/', { accept: 'text/markdown, text/html;q=0.5' });
ok(/^text\/markdown/.test(r.ct), 'Accept with markdown preferred → Markdown');
r = await get('/', { accept: 'text/html,application/xhtml+xml' });
ok(/^text\/html/.test(r.ct) && /Accept/i.test(r.vary) && /llms\.txt/.test(r.link), 'browsers still get HTML, with Vary: Accept and Link to llms.txt', r.vary);
r = await get('/llms.txt');
ok(r.status === 200 && /^text\/(plain|markdown)/.test(r.ct) && /^# PointMint/m.test(r.text) && /\.md/.test(r.text) && /\/mcp/.test(r.text), '/llms.txt lists Markdown pages and the MCP endpoint');
r = await get('/nope.md'); ok(r.status === 404 && /^text\/markdown/.test(r.ct), 'unknown .md → 404 Markdown');
r = await get('/h/h_nope.md'); ok(r.status === 404, 'unknown member .md → 404', r.status);
r = await get('/docs.md', {}, 'HEAD'); ok(r.status === 200 && r.text === '', 'HEAD /docs.md works');
r = await get('/docs.md'); ok(/send_message/.test(r.text) && /list_messages/.test(r.text) && /inputSchema|"properties"/.test(r.text), 'docs.md includes every tool with schemas');
r = await get('/vault.md'); ok(r.status === 200 && !/visibility: "private"|"visibility": "private"/.test(r.text), 'anonymous vault.md shows no private items');
// one data source: /api/page md equals the .md body (minus the volatile generated timestamp)
const strip = t => t.replace(/^generated: .*$/m, '').replace(/^\s+|\s+$/g, '');
const a = await get('/network.md'), b = await fetch(BASE + '/api/page?path=/network').then(x => x.json());
ok(strip(a.text) === strip(b.md.full), 'agent column Markdown === /network.md (one data source)', `${a.text.length}B vs ${b.md.full.length}B`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
