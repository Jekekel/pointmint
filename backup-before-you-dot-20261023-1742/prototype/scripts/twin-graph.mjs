// Digital Twin Score + knowledge graph + post media: node scripts/twin-graph.mjs https://host   (never prints credentials)
const BASE = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '');
let pass = 0, fail = 0;
const ok = (c, msg, extra = '') => { if (c) { pass++; console.log('PASS', msg, extra); } else { fail++; console.log('FAIL', msg, extra); } };
function client() {
  let cookie = '';
  return async (path, { method = 'GET', body, auth, accept = 'application/json' } = {}) => {
    const h = { accept, origin: BASE };
    if (body !== undefined) h['content-type'] = 'application/json';
    if (cookie && !auth) h.cookie = cookie;
    if (auth) h.authorization = 'Bearer ' + auth;
    const r = await fetch(BASE + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc && sc.startsWith('__Host-pm_session=')) cookie = sc.split(';')[0];
    const text = await r.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, data, text };
  };
}
const anon = client();
async function person(name) {
  const c = client();
  const phone = '+1 (555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  let r = await c('/api/auth/start', { method: 'POST', body: { phone } });
  if (r.status !== 200) throw new Error(`start failed ${r.status} ${r.data?.error || ''}`);
  r = await c('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name, headline: 'Posts test (test account)' } });
  if (r.status !== 200) throw new Error('verify failed ' + r.status);
  const me = (await c('/api/me')).data;
  r = await c('/api/agent', { method: 'POST', body: { name: name + "'s agent", provider: 'Claude' } });
  return { c, id: me.human.id, tok: r.data.credential, agentId: r.data.agent_id };
}
async function tool(who, name, args) {
  const r = await who.c('/mcp', { method: 'POST', auth: who.tok, body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } } });
  const res = r.data.result; let out = null; try { out = JSON.parse(res.content[0].text); } catch {}
  return { status: r.status, isError: !!(res && res.isError) || !!r.data.error, out, text: res ? res.content?.[0]?.text : JSON.stringify(r.data.error) };
}
const pub = async hid => (await anon('/api/posts?human_id=' + hid + '&limit=50')).data.posts;


// ---- graph: public, permission-respecting, agent-readable ----
let r = await anon('/graph.json');
const G = r.data;
ok(r.status === 200 && Array.isArray(G.nodes) && Array.isArray(G.edges), '/graph.json is public JSON', `${G.nodes?.length} nodes, ${G.edges?.length} edges`);
const H = G.nodes.filter(n => n.type === 'human'), Ag = G.nodes.filter(n => n.type === 'agent');
const demoH = H.filter(n => n.demo);
ok(demoH.length >= 40 && demoH.length <= 80, '40–80 fictional demo humans seeded', String(demoH.length));
ok(Ag.length >= demoH.length, 'every demo human has its one agent node', `${Ag.length} agents`);
const tethers = G.edges.filter(e => e.type === 'tether');
ok(tethers.length === Ag.length && tethers.every(e => G.nodes.find(n => n.id === e.target)?.human_id === e.source), 'each human is tethered to exactly its own agent');
for (const t of ['intent', 'match', 'intro', 'message', 'together']) ok(G.edges.some(e => e.type === t), `edge type present: ${t}`);
ok(G.nodes.some(n => n.type === 'intent') && G.nodes.every(n => n.type !== 'intent' || ['buy', 'sell', 'seek', 'acquire'].includes(n.intent)), 'vault intents are satellite nodes (buy/sell/seek/acquire)');
ok(G.nodes.filter(n => n.type === 'intent').every(n => n.visibility === 'public'), 'anonymous graph shows public intents only');
ok(!JSON.stringify(G).match(/\+1\d{10}|phone_e164|contact|credential/), 'no phone numbers, contacts or credentials in the graph');
ok(H.every(n => n.photo_url === null || /^\/media\/photos\//.test(n.photo_url)) && Ag.every(n => /^\/avatars\/agent_[a-z0-9_]+\.svg$/.test(n.avatar_url)), 'humans carry real photos (or none), agents carry sunglasses avatars');
const intros = G.edges.filter(e => e.type === 'intro');
const isDemo = id => G.nodes.find(n => n.id === id)?.demo;
ok(intros.every(e => isDemo(e.source) && isDemo(e.target)), 'anonymous graph: intros only between fictional demo members');
r = await anon('/graph.md', { accept: 'text/markdown' });
ok(r.status === 200 && /^# PointMint network graph/m.test(r.text) && /untrusted/.test(r.text) && /get_graph_neighborhood/.test(r.text), '/graph.md is agent-readable Markdown with untrusted fences');
r = await anon('/llms.txt', { accept: 'text/plain' }); ok(/graph\.md/.test(r.text), 'llms.txt lists the graph');

// ---- twin score: transparent components, only human-confirmed actions count ----
r = await anon('/api/twin/h_d00001');
const T = r.data.digital_twin_score;
ok(r.status === 200 && T && T.total >= 0 && T.total <= 100, 'twin score 0–100 for a demo member', String(T?.total));
const keys = (T?.components || []).map(c => c.key + ':' + c.max).join(',');
ok(keys === 'vault:25,verification:20,profile:10,alignment:25,outcomes:10,collaboration:10', 'six weighted components (25/20/10/25/10/10)', keys);
ok(T.components.every(c => c.points >= 0 && c.points <= c.max && c.tip && c.detail), 'every component shows points, detail and a tip');
ok(Math.abs(T.components.reduce((s, c) => s + c.points, 0) - T.total) <= 1, 'total = sum of components');
r = await anon('/h/h_d00001.md', { accept: 'text/markdown' });
ok(/## Digital twin score/.test(r.text) && /"digital_twin_score"/.test(r.text) && /"components"/.test(r.text), 'profile Markdown carries digital_twin_score {total, components[]}');
const demoTwins = H.filter(n => n.demo && n.twin != null).map(n => n.twin);
ok(demoTwins.length === 0 || (Math.min(...demoTwins) >= 0 && Math.max(...demoTwins) <= 100), 'graph human nodes carry cached twin totals', `${demoTwins.length} cached`);

const A = await person('Twin Tester');
let s0 = (await tool(A, 'get_twin_score', {})).out?.digital_twin_score;
ok(s0 && s0.total >= 0, 'MCP get_twin_score for my human', String(s0?.total));
// The agent tries to inflate: adds vault cards and posts in its own voice, starts a "together" post. None counts.
await tool(A, 'add_vault_item', { type: 'buy', title: 'Agent-added card', tags: ['x'] });
await tool(A, 'add_vault_item', { type: 'sell', title: 'Agent-added card 2', tags: ['x'] });
await tool(A, 'create_post', { body: 'Agent voice post', author: 'agent' });
const both = await tool(A, 'create_post', { body: 'Together? (agent says so)', author: 'both' });
let s1 = (await tool(A, 'get_twin_score', {})).out?.digital_twin_score;
const comp = (s, k) => s.components.find(c => c.key === k).points;
ok(comp(s1, 'vault') === comp(s0, 'vault') && comp(s1, 'collaboration') === comp(s0, 'collaboration') && comp(s1, 'alignment') === comp(s0, 'alignment'), 'agent-only actions do not raise the score', `${s0.total} → ${s1.total}`);
// The human confirms the together post and adds their own card: now it counts.
r = await A.c(`/api/posts/${both.out.post.id}/approve`, { method: 'POST' });
await A.c('/api/vault', { method: 'POST', body: { type: 'seek', title: 'Human-written card', tags: 'test' } });
let s2 = (await tool(A, 'get_twin_score', {})).out?.digital_twin_score;
ok(comp(s2, 'collaboration') > comp(s1, 'collaboration') && comp(s2, 'vault') > comp(s1, 'vault') && comp(s2, 'alignment') > comp(s1, 'alignment'), 'human-confirmed actions raise it (recomputed on the event)', `${s1.total} → ${s2.total}`);
r = await tool(A, 'get_twin_score', { human_id: A.id === 'h_d00001' ? 'h_x' : 'h_zzzzzzzz' });
ok(r.isError, 'get_twin_score refuses non-demo members other than my own');

// ---- MCP graph neighborhood ----
r = await tool(A, 'get_graph_neighborhood', { node_id: 'h_d00001', depth: 1 });
ok(!r.isError && r.out.nodes.some(n => n.id === 'h_d00001') && r.out.nodes.some(n => n.id === 'agent_d00001') && r.out.edges.length > 0, 'get_graph_neighborhood returns the pair and its edges', `${r.out?.nodes?.length} nodes`);
r = await tool(A, 'get_graph_neighborhood', {});
ok(!r.isError && r.out.nodes.some(n => n.id === A.id && n.you), 'default neighbourhood is my own human (marked you)');
r = await tool(A, 'get_graph_neighborhood', { node_id: 'h_nope0000' });
ok(r.isError, 'unknown node → error');

// ---- post media ----
r = await A.c('/api/posts', { method: 'POST', body: { body: 'A prompt I use', media: { kind: 'prompt', title: 'Weekly check', text: 'List stale cards.' } } });
ok(r.status === 201 && r.data.post.media?.kind === 'prompt', 'human posts with a shared prompt');
r = await A.c('/api/posts', { method: 'POST', body: { body: 'Hotlink', media: { kind: 'image', url: 'https://evil.example/x.jpg' } } });
ok(r.status === 400, 'images must be served from our own origin (no hotlinks)');
r = await tool(A, 'create_post', { body: 'agent with image', author: 'agent', media: { kind: 'image', url: '/glass/media/studio.webp' } });
ok(r.isError, 'an AI agent cannot attach images or video');
r = await anon('/api/posts?human_id=h_d00001&limit=50');
ok(r.data.posts.some(p => p.media && ['image', 'video', 'skill', 'prompt'].includes(p.media.kind)), 'demo posts carry media');
r = await anon('/api/graph?focus=h_d00002&depth=1');
ok(r.status === 200 && r.data.nodes.length > 2 && r.data.nodes.length < G.nodes.length, '/api/graph?focus= returns a neighbourhood');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
