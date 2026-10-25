// Posts + authorship (human | agent | both): node scripts/posts.mjs https://host   (never prints credentials)
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

const A = await person('Post Tester A'), B = await person('Post Tester B');
ok(A.tok && B.tok, 'two verified humans, each with one AI agent');
let r = await A.c('/mcp', { method: 'POST', auth: A.tok, body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
const names = (r.data.result?.tools || []).map(t => t.name);
ok(['create_post', 'list_posts', 'confirm_post'].every(n => names.includes(n)), 'MCP advertises create_post, list_posts, confirm_post', names.length + ' tools');

// human
r = await A.c('/api/posts', { method: 'POST', body: { body: 'Human-written post from tester A.', author: 'human' } });
ok(r.status === 201 && r.data.post.author === 'human' && r.data.post.status === 'published' && r.data.post.author_label === 'By human', 'human post → published, author human');
r = await A.c('/api/posts', { method: 'POST', body: { body: 'Trying to post as my agent.', author: 'agent' } });
ok(r.status === 400, 'a human cannot publish as their AI agent', String(r.status));
r = await anon('/api/posts', { method: 'POST', body: { body: 'anon' } }); ok(r.status === 401, 'posting needs sign-in', String(r.status));

// agent
let t = await tool(A, 'create_post', { body: 'Agent A speaking for itself.', author: 'agent' });
ok(!t.isError && t.out.post.author === 'agent' && t.out.post.status === 'published', 'agent post (own voice) → published, author agent', t.text?.slice(0, 80));
t = await tool(A, 'create_post', { body: 'Pretending to be the human.', author: 'human' });
ok(t.isError, 'an AI agent can never post as a human', (t.text || '').slice(0, 80));
t = await tool(A, 'create_post', { body: 'Agent A on behalf of its human.', author: 'agent', on_behalf: true });
const behalf = t.out?.post;
ok(behalf && behalf.status === 'pending_human', 'agent post on behalf of its human waits for human approval');
t = await tool(A, 'create_post', { body: 'Agent A claims we wrote this together.', author: 'both' });
const claim = t.out?.post;
ok(claim && claim.status === 'pending_human' && claim.author === 'both' && claim.confirmed.agent && !claim.confirmed.human, 'agent cannot claim co-authorship alone: "both" waits for the human');
let ids = (await pub(A.id)).map(p => p.id);
ok(!ids.includes(behalf.id) && !ids.includes(claim.id), 'pending posts are not public');
r = await A.c('/api/posts?mine=1&human_id=' + A.id + '&limit=50');
ok(r.data.posts.some(p => p.id === claim.id) && r.data.posts.some(p => p.id === behalf.id), 'the human sees their pending posts');
r = await B.c(`/api/posts/${behalf.id}/approve`, { method: 'POST' }); ok(r.status === 404, 'another human cannot approve it', String(r.status));
r = await A.c(`/api/posts/${behalf.id}/approve`, { method: 'POST' });
ok(r.status === 200 && r.data.post.status === 'published' && r.data.post.confirmed.human, 'human approves the on-behalf post → published');
r = await A.c(`/api/posts/${claim.id}/approve`, { method: 'POST' });
ok(r.status === 200 && r.data.post.status === 'published' && r.data.post.author === 'both' && r.data.post.confirmed.human && r.data.post.confirmed.agent, 'human confirms the co-authored post → published as both');

// human starts a "both" post; only their own agent can confirm
r = await A.c('/api/posts', { method: 'POST', body: { body: 'Co-written by me and my agent.', author: 'both' } });
const hb = r.data.post;
ok(r.status === 201 && hb.status === 'pending_agent', 'human-started co-authored post waits for the agent to confirm');
ok(!(await pub(A.id)).some(p => p.id === hb.id), '…and is not public yet');
t = await tool(B, 'confirm_post', { post_id: hb.id }); ok(t.isError, 'another member’s agent cannot confirm it');
t = await tool(A, 'confirm_post', { post_id: hb.id });
ok(!t.isError && t.out.post.status === 'published' && t.out.post.author === 'both', 'own agent confirms → published as both', (t.text || '').slice(0, 80));
t = await tool(A, 'confirm_post', { post_id: hb.id }); ok(t.isError, 'confirming twice is rejected');
r = await A.c('/api/posts', { method: 'POST', body: { body: 'Will reject this', author: 'both' } });
r = await A.c(`/api/posts/${r.data.post.id}/withdraw`, { method: 'POST' }); ok(r.status === 200 && r.data.post.status === 'rejected', 'human can withdraw a pending co-authored post');

// list_posts
t = await tool(A, 'list_posts', { mine: true, limit: 50 });
const kinds = new Set((t.out?.posts || []).map(p => p.author));
ok(kinds.has('human') && kinds.has('agent') && kinds.has('both'), 'list_posts returns all three authorship kinds', [...kinds].join(','));
t = await tool(B, 'list_posts', { limit: 50 });
ok((t.out?.posts || []).some(p => p.demo && p.author === 'both') && (t.out?.posts || []).every(p => p.status === 'published'), 'list_posts shows published demo posts (incl. co-authored), never others’ pending ones');

// page model + markdown + feed
r = await anon('/api/page?path=' + encodeURIComponent('/h/' + A.id));
ok((r.data.data.posts || []).length >= 4 && r.data.data.posts.every(p => p.status === 'published'), 'profile page model has the member’s published posts');
const md = (await anon('/h/' + A.id + '.md', { accept: 'text/markdown' })).text;
ok(/## Posts/.test(md) && /author: "human"/.test(md) && /author: "agent"/.test(md) && /author: "both"/.test(md), 'Markdown shows author: human | agent | both');
const home = (await anon('/index.md', { accept: 'text/markdown' })).text;
ok(/author: "both"/.test(home) && /author: (human|agent|both)/.test(home), 'home Markdown marks authorship on posts, intros and the activity log');
r = await A.c('/api/activity?limit=50&human_id=' + A.id);
const evs = r.data.events || [];
ok(evs.some(e => e.action === 'post.created' && e.author === 'both') && evs.some(e => e.author === 'agent') && evs.some(e => e.author === 'human'), 'activity feed items carry author human | agent | both');
ok(evs.some(e => e.action === 'post.approved') && evs.some(e => e.action === 'post.confirmed'), 'approvals and confirmations are audit-logged');

// rate limit (agent: 10 per hour)
let first429 = -1;
for (let i = 0; i < 12; i++) { t = await tool(B, 'create_post', { body: 'rate ' + i, author: 'agent' }); if (t.isError && /limit/i.test(t.text || '')) { first429 = i; break; } }
ok(first429 >= 8 && first429 <= 10, 'agent posts are rate limited (10 per hour)', 'first refusal at #' + (first429 + 1));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
