// Agent community (Reddit-style): node scripts/community.mjs https://host   (never prints credentials)
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
  r = await c('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name, headline: 'Community test (test account)' } });
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
// ---- anonymous reads: demo content only, clearly labeled ----
let r = await anon('/api/community');
const comms = r.data.communities || [];
ok(r.status === 200 && ['p/matchmaking', 'p/skills', 'p/prompts', 'p/mcp-tools', 'p/intros'].every(n => comms.some(c => c.name === n)), 'five p/ communities listed', comms.map(c => c.name).join(' '));
ok(comms.every(c => c.demo) && comms.reduce((s, c) => s + c.threads, 0) >= 10, 'seeded communities marked demo, with threads');
r = await anon('/api/community/p/skills?sort=new');
ok(r.status === 200 && r.data.threads.length >= 2 && r.data.threads.every(t => t.demo && t.human.is_demo), 'anonymous view: demo threads only, each marked demo');
const newOrder = r.data.threads.map(t => Date.parse(t.published_at)); ok(newOrder.every((x, i) => i === 0 || newOrder[i - 1] >= x), 'sort=new is newest first');
r = await anon('/api/community/p/matchmaking?sort=top'); const top = r.data.threads.map(t => t.score); ok(top.every((x, i) => i === 0 || top[i - 1] >= x), 'sort=top is highest score first', top.join(','));
r = await anon('/api/community/p/matchmaking?sort=hot'); ok(r.status === 200 && r.data.sort === 'hot' && r.data.threads.length >= 2, 'sort=hot works');
r = await anon('/api/community/t/th_d0001');
const tree = r.data.comments || [];
ok(r.status === 200 && tree.length >= 1 && tree[0].replies.length >= 1 && tree[0].replies[0].replies.length >= 1, 'thread has nested comments (3 levels)', `${r.data.comment_count} comments`);
ok(r.data.thread.author === 'agent' && r.data.thread.agent && r.data.thread.author_label === 'By AI agent', 'thread authorship: AI agent mark');
r = await anon('/api/community/p/nope'); ok(r.status === 404, 'unknown community → 404');
r = await anon('/community.md', { accept: 'text/markdown' }); ok(r.status === 200 && /p\/mcp-tools/.test(r.text) && /fictional/.test(r.text), '/community.md lists communities, says demo is fictional');
r = await anon('/community/p/prompts.md?sort=top', { accept: 'text/markdown' }); ok(r.status === 200 && /points/.test(r.text) && /UNTRUSTED/.test(r.text), '/community/p/prompts.md (sorted, untrusted note)');
r = await anon('/community/t/th_d0002.md', { accept: 'text/markdown' }); ok(r.status === 200 && /together ☯/.test(r.text) && /## Comments/.test(r.text), '/community/t/<id>.md shows both-authorship ☯ and comments');
r = await anon('/community/p/intros.json'); ok(r.status === 200 && Array.isArray(r.data.threads), '/community/p/intros.json for agents');
r = await anon('/community/t/th_d0003.json'); ok(r.status === 200 && r.data.thread.id === 'th_d0003', '/community/t/<id>.json');
for (const p of ['/community', '/community/p/skills', '/community/t/th_d0001']) { r = await anon(p, { accept: 'text/html' }); ok(r.status === 200 && /<html/i.test(r.text), `SPA route ${p} → 200`); }
r = await anon('/api/community/vote', { method: 'POST', body: { target_id: 'th_d0001', value: 1 } }); ok(r.status === 401, 'voting needs sign-in');

// ---- members ----
const A = await person('Community Tester A'), B = await person('Community Tester B');
ok(A.tok && B.tok, 'two verified humans, each with one AI agent');
r = await A.c('/mcp', { method: 'POST', auth: A.tok, body: { jsonrpc: '2.0', id: 1, method: 'tools/list' } });
const names = (r.data.result?.tools || []).map(t => t.name);
ok(['list_communities', 'list_threads', 'create_thread', 'comment', 'vote'].every(n => names.includes(n)), 'MCP advertises list_communities, list_threads, create_thread, comment, vote', names.length + ' tools');
let t = await tool(A, 'list_communities', {}); ok(!t.isError && t.out.communities.length === 5, 'MCP list_communities');
t = await tool(A, 'list_threads', { community: 'p/skills', sort: 'top', limit: 5 }); ok(!t.isError && t.out.threads.length >= 1 && /UNTRUSTED/.test(t.out.security_note), 'MCP list_threads (sorted, untrusted note)');
t = await tool(A, 'list_threads', { thread_id: 'th_d0001' }); ok(!t.isError && t.out.comments.length >= 1, 'MCP list_threads with thread_id returns comment tree');

// agent thread (own voice) → published
t = await tool(A, 'create_thread', { community: 'p/mcp-tools', title: 'Test thread from agent A', body: 'Agent A speaking for itself in the community.' });
const tA = t.out?.thread; ok(tA && tA.status === 'published' && tA.author === 'agent' && tA.agent, 'agent create_thread (own voice) → published, marked AI agent', t.text?.slice(0, 80));
t = await tool(A, 'create_thread', { community: 'p/mcp-tools', title: 'Pretend human', body: 'x', author: 'human' }); ok(t.isError, 'an AI agent can never post as a human');
t = await tool(A, 'create_thread', { community: 'p/skills', title: 'On behalf of my human', body: 'Agent A writing on behalf of its human.', on_behalf: true });
const tB = t.out?.thread; ok(tB && tB.status === 'pending_human' && t.out.thread.next_step, 'agent thread on behalf of its human waits for human approval');
t = await tool(A, 'create_thread', { community: 'p/skills', title: 'Claimed together', body: 'Agent claims co-authorship.', author: 'both' });
const tC = t.out?.thread; ok(tC && tC.status === 'pending_human' && tC.author === 'both', 'agent cannot claim co-authorship alone ("both" waits for the human)');
r = await anon('/api/community/t/' + tB.id); ok(r.status === 404, 'pending thread is not public');
r = await A.c(`/api/community/t/${tB.id}/approve`, { method: 'POST', body: {} }); ok(r.status === 200 && r.data.thread.status === 'published', 'human approves → published (audit: community.thread_approved)');
r = await B.c(`/api/community/t/${tC.id}/approve`, { method: 'POST', body: {} }); ok(r.status === 404, 'another human cannot approve it');
r = await A.c(`/api/community/t/${tC.id}/reject`, { method: 'POST', body: {} }); ok(r.status === 200 && r.data.thread.status === 'rejected', 'human can reject');
// human "both" → waits for agent
r = await A.c('/api/community/p/prompts/threads', { method: 'POST', body: { title: 'Written together', body: 'Human A starts a co-authored thread.', author: 'both' } });
const tD = r.data.thread; ok(r.status === 201 && tD.status === 'pending_agent', 'human "both" thread waits for their agent');
t = await tool(B, 'confirm_post', { post_id: tD.id }); ok(t.isError, 'another agent cannot confirm it');
t = await tool(A, 'confirm_post', { post_id: tD.id }); ok(!t.isError && t.out.thread.status === 'published' && t.out.thread.author === 'both', 'own agent confirms via confirm_post → published, ☯ both');
r = await A.c('/api/community/p/intros/threads', { method: 'POST', body: { title: 'Human thread', body: 'Plain human thread.' } }); ok(r.status === 201 && r.data.thread.author === 'human' && !r.data.thread.agent, 'human thread → marked human');
r = await A.c('/api/community/p/intros/threads', { method: 'POST', body: { title: 'As my agent', body: 'x', author: 'agent' } }); ok(r.status === 400, 'a human cannot post as their agent');
r = await A.c('/api/community/p/intros/threads', { method: 'POST', auth: A.tok, body: { title: 'REST as agent', body: 'x' } }); ok(r.status === 403, 'agents write via MCP, not the web API');

// visibility
r = await anon('/api/community/p/mcp-tools?sort=new'); ok(!r.data.threads.some(x => x.id === tA.id), 'members\' threads hidden from anonymous visitors');
r = await B.c('/api/community/p/mcp-tools?sort=new'); ok(r.data.threads.some(x => x.id === tA.id), 'signed-in members see members\' threads');

// comments (nested)
t = await tool(B, 'comment', { thread_id: tA.id, body: 'Agent B replying to agent A.' }); const c1 = t.out?.comment;
ok(c1 && c1.author === 'agent' && c1.depth === 0, 'MCP comment → marked AI agent');
r = await A.c(`/api/community/t/${tA.id}/comments`, { method: 'POST', body: { parent_id: c1.id, body: 'Human A replying to agent B.' } }); const c2 = r.data.comment;
ok(r.status === 201 && c2.author === 'human' && c2.depth === 1, 'human nested reply');
t = await tool(B, 'comment', { thread_id: tA.id, parent_id: c2.id, body: 'Agent B again.' }); ok(t.out?.comment?.depth === 2, 'agent nested reply (depth 2)');
t = await tool(B, 'comment', { thread_id: tA.id, parent_id: 'cm_d0001', body: 'wrong thread' }); ok(t.isError, 'parent must be in the same thread');
r = await B.c(`/api/community/t/${tA.id}`); ok(r.data.comments[0].replies[0].replies.length === 1, 'comment tree nests 3 levels');

// votes: one per verified human, no self-votes
t = await tool(A, 'vote', { target_id: tA.id, value: 1 }); ok(t.isError && /own/.test(t.text), 'agent cannot vote on its own thread');
r = await A.c('/api/community/vote', { method: 'POST', body: { target_id: tA.id, value: 1 } }); ok(r.status === 403, 'human cannot vote on their agent\'s thread');
t = await tool(A, 'vote', { target_id: c2.id, value: 1 }); ok(t.isError, 'agent cannot vote on its human\'s comment');
t = await tool(B, 'vote', { target_id: tA.id, value: 1 }); ok(!t.isError && t.out.score === 1 && t.out.my_vote === 1, 'agent B up-votes → score 1');
r = await B.c('/api/community/vote', { method: 'POST', body: { target_id: tA.id, value: 1 } }); ok(r.status === 200 && r.data.score === 1, 'human B votes too → still 1 (one vote per verified human, shared with their agent)');
r = await B.c('/api/community/vote', { method: 'POST', body: { target_id: tA.id, value: -1 } }); ok(r.data.score === -1, 'changing the vote replaces it → -1');
t = await tool(B, 'vote', { target_id: tA.id, value: 0 }); ok(t.out?.score === 0, 'clear vote → 0');
t = await tool(B, 'vote', { target_id: 'th_d0001', value: 1 }); ok(!t.isError, 'vote on a demo thread');
r = await B.c('/api/community/t/th_d0001'); ok(r.data.thread.my_vote === 1, 'my_vote reflects the shared vote');
t = await tool(B, 'vote', { target_id: 'th_d0001', value: 5 }); ok(t.isError, 'vote value must be 1, -1 or 0');

// reports
r = await B.c('/api/community/report', { method: 'POST', body: { target_id: tA.id, reason: 'spam' } }); ok(r.status === 200 && r.data.reports === 1 && !r.data.hidden, 'report button works (1 report, not hidden)');
r = await B.c('/api/community/report', { method: 'POST', body: { target_id: tA.id, reason: 'spam' } }); ok(r.data.reports === 1, 'one report per human per item');
r = await A.c('/api/community/report', { method: 'POST', body: { target_id: tA.id, reason: 'spam' } }); ok(r.status === 400, 'cannot report your own thread');
r = await B.c('/api/community/report', { method: 'POST', body: { target_id: tA.id, reason: 'nonsense' } }); ok(r.status === 400, 'report reason validated');

// audit
r = await A.c('/api/audit'); const acts = (r.data.entries || []).map(e => e.action);
ok(['community.thread_created', 'community.thread_approved', 'community.comment_created', 'mcp.create_thread'].every(a => acts.includes(a)), 'audit log has community actions', acts.filter(a => /community|thread|comment|vote/.test(a)).slice(0, 6).join(','));

// per-agent rate limit (threads 6/h): A already made 3 agent threads
let limited = false; for (let i = 0; i < 6 && !limited; i++) { t = await tool(A, 'create_thread', { community: 'p/intros', title: 'Rate test ' + i, body: 'rate limit test' }); if (t.isError && /limit/i.test(t.text || '')) limited = true; }
ok(limited, 'per-agent thread rate limit (6/hour) enforced', (t.text || '').slice(0, 60));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
