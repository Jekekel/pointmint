// End-to-end test: node scripts/e2e.mjs https://host   (never prints full credentials)
const BASE = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '');
let cookie = '', pass = 0, fail = 0;
const ok = (c, msg, extra = '') => { if (c) { pass++; console.log('PASS', msg, extra); } else { fail++; console.log('FAIL', msg, extra); } };
async function req(path, { method = 'GET', body, auth, raw } = {}) {
  const h = { accept: 'application/json' };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (cookie) h.cookie = cookie;
  if (auth) h.authorization = 'Bearer ' + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && sc.startsWith('__Host-pm_session=')) cookie = sc.split(';')[0];
  const text = await r.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, headers: r.headers };
}
const mcp = (tok, method, params, id = 1) => req('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', id, method, ...(params ? { params } : {}) } });

// 1. UI + headers
let r = await req('/');
ok(r.status === 200 && String(r.data).includes('Prototype - demo data - simulated SMS'), 'GET / loads with prototype banner');
ok(/default-src 'self'/.test(r.headers.get('content-security-policy') || '') && /max-age/.test(r.headers.get('strict-transport-security') || '') && r.headers.get('x-frame-options') === 'DENY', 'security headers CSP/HSTS/XFO present');
for (const p of ['/about', '/docs', '/network', '/app.js']) { r = await req(p); ok(r.status === 200, `GET ${p} 200`); }
// 2. browse without signup
r = await req('/api/network'); ok(r.status === 200 && r.data.members.length >= 8, 'demo network browsable anonymously', JSON.stringify(r.data.stats));
ok(r.data.members.every(m => m.human.kind === 'human' && (!m.agent || m.agent.label === 'AI agent')), 'every member labeled human / AI agent');
r = await req('/api/showcase/intros'); ok(r.status === 200 && r.data.intros.length >= 4 && r.data.intros.some(i => i.messages.some(m => m.sender_label === 'AI agent')) && r.data.intros.some(i => i.messages.some(m => m.sender_label === 'Human')), 'demo intros+messages with Human/AI labels');
ok(r.data.intros.every(i => !i.counterpart_contact), 'no contact info leaked to anonymous viewers');
r = await req('/api/matches?human_id=h_d00001'); ok(r.status === 200 && r.data.matches.length > 0, 'demo matches computed', `top=${r.data.matches[0]?.score} ${r.data.matches[0]?.my_item.title} <-> ${r.data.matches[0]?.their_item.title}`);
// 3. sign-up with simulated OTP
const phone = '+1 (555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000);
r = await req('/api/auth/start', { method: 'POST', body: { phone } });
ok(r.status === 200 && r.data.demo_mode && /^\d{6}$/.test(r.data.simulated_sms.code), 'OTP start returns simulated SMS', `e164=${r.data.phone_e164}`);
const otp = r.data;
r = await req('/api/auth/verify', { method: 'POST', body: { otp_id: otp.otp_id, code: otp.simulated_sms.code === '000000' ? '111111' : '000000', name: 'E2E Tester' } });
ok(r.status === 400 && /attempt/.test(r.data.error), 'wrong OTP rejected', r.data.error);
r = await req('/api/auth/verify', { method: 'POST', body: { otp_id: otp.otp_id, code: otp.simulated_sms.code, name: 'E2E Tester', headline: 'QA bot (test account)' } });
ok(r.status === 200 && r.data.created && cookie, 'correct OTP creates human + session cookie');
r = await req('/api/auth/verify', { method: 'POST', body: { otp_id: otp.otp_id, code: otp.simulated_sms.code } });
ok(r.status === 400, 'OTP cannot be reused');
r = await req('/api/me'); ok(r.data.signed_in && r.data.human.verified, 'session works, human verified', r.data.human?.phone_masked);
const humanId = r.data.human.id;
// 4. one agent per human
r = await req('/api/agent', { method: 'POST', body: { name: 'E2E Agent', provider: 'Claude' } });
ok(r.status === 201 && /^pm_agent_[A-Za-z0-9_-]{43}$/.test(r.data.credential), 'agent minted, credential shown once', `prefix=${r.data.credential?.slice(0, 13)}…`);
let tok = r.data.credential;
r = await req('/api/agent', { method: 'POST', body: { name: 'Second', provider: 'Grok' } });
ok(r.status === 409, 'second agent mint REJECTED', `${r.status} ${r.data.error}`);
// 5. vault
r = await req('/api/vault', { method: 'POST', body: { type: 'buy', title: 'Buying commercial espresso machines', description: 'Need 2 machines for a cafe', tags: 'coffee, equipment', budget_min: 5000, budget_max: 20000 } });
ok(r.status === 201, 'vault item created via UI API');
r = await req('/api/vault', { method: 'POST', body: { type: 'banana', title: 'x' } }); ok(r.status === 400, 'invalid vault input rejected', r.data.error);
// 6. MCP
r = await mcp(null, 'tools/list'); ok(r.status === 401, 'MCP without credential -> 401');
r = await mcp('pm_agent_' + 'x'.repeat(43), 'tools/list'); ok(r.status === 401, 'MCP with bogus credential -> 401');
r = await mcp(tok, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } });
ok(r.status === 200 && r.data.result?.capabilities?.tools, 'MCP initialize', `protocol=${r.data.result?.protocolVersion}`);
r = await req('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', method: 'notifications/initialized' } }); ok(r.status === 202, 'notifications/initialized -> 202');
r = await mcp(tok, 'tools/list'); const names = (r.data.result?.tools || []).map(t => t.name);
ok(names.length === 14 && names.includes('find_connection_path') && names.includes('get_twin_score') && names.includes('get_graph_neighborhood') && names.includes('list_messages') && names.includes('create_post') && names.includes('list_posts') && names.includes('confirm_post'), 'MCP tools/list', names.join(','));
r = await mcp(tok, 'tools/call', { name: 'search_matches', arguments: { limit: 5 } });
const ms = r.data.result?.structuredContent?.matches || [];
ok(r.status === 200 && !r.data.result.isError && ms.length > 0, 'MCP tools/call search_matches', `n=${ms.length} top=${ms[0]?.score} "${ms[0]?.their_item.title}" (${ms[0]?.counterpart.human.name})`);
r = await mcp(tok, 'tools/call', { name: 'add_vault_item', arguments: { type: 'seek', title: 'Bookkeeping SaaS for my cafe', tags: ['accounting', 'saas'] } });
ok(!r.data.result?.isError && r.data.result.structuredContent.item.created_by === 'agent', 'MCP add_vault_item (created_by=agent)');
r = await mcp(tok, 'tools/call', { name: 'get_my_profile', arguments: {} }); ok(r.data.result?.structuredContent?.agent?.label === 'AI agent', 'MCP get_my_profile');
r = await mcp(tok, 'tools/call', { name: 'get_my_vault', arguments: {} }); ok(r.data.result?.structuredContent?.items?.length === 2, 'MCP get_my_vault');
const target = ms.find(m => m.counterpart.agent) || ms[0];
r = await mcp(tok, 'tools/call', { name: 'propose_intro', arguments: { to_agent_id: target.counterpart.agent.id, reason: 'Our espresso buy/sell cards match.', my_item_id: target.my_item.id, their_item_id: target.their_item.id } });
const intro = r.data.result?.structuredContent?.intro;
ok(intro && intro.status === 'pending_human_approval', 'MCP propose_intro -> pending_human_approval', intro?.id);
r = await mcp(tok, 'tools/call', { name: 'send_message', arguments: { intro_id: intro.id, body: 'hello' } });
ok(r.data.result?.isError, 'MCP send_message blocked before approval', r.data.result?.content?.[0]?.text);
r = await mcp(tok, 'tools/call', { name: 'list_intros', arguments: {} }); ok(r.data.result?.structuredContent?.intros?.some(i => i.id === intro.id), 'MCP list_intros');
r = await req('/api/intros/' + intro.id); ok(r.status === 200 && !r.data.intro.counterpart_contact, 'no contact info before approvals');
r = await req(`/api/intros/${intro.id}/accept`, { method: 'POST' }); ok(r.status === 403, 'sender human cannot accept on recipient behalf');
r = await req(`/api/intros/${intro.id}/approve`, { method: 'POST' }); ok(r.status === 200 && r.data.intro.status === 'pending_recipient', 'human approves -> sent (pending_recipient)');
r = await req(`/api/intros/${intro.id}/approve`, { method: 'POST' }); ok(r.status === 409, 'double approve rejected');
// 7. audit
r = await req('/api/audit'); const ai = r.data.entries.filter(e => e.actor_type === 'agent');
ok(ai.length >= 7 && ai.every(e => e.actor_label === 'AI agent'), 'audit log records MCP actions labeled AI agent', `ai=${ai.length} total=${r.data.entries.length}`);
// 8. rotate / revoke
r = await req('/api/agent/rotate', { method: 'POST' }); const tok2 = r.data.credential;
ok(r.status === 200 && tok2 && tok2 !== tok, 'rotate issues new credential', `prefix=${tok2?.slice(0, 13)}…`);
r = await mcp(tok, 'tools/list'); ok(r.status === 401, 'old credential rejected after rotation');
r = await mcp(tok2, 'tools/list'); ok(r.status === 200, 'new credential works');
r = await req('/api/me'); ok(r.data.agent && r.data.agent.id, 'still exactly one agent after rotation');
// 9. MCP rate limit (60/min)
let got429 = false, n = 0;
for (let i = 0; i < 65 && !got429; i++) { n++; r = await mcp(tok2, 'ping', undefined, i); if (r.status === 429) got429 = true; }
ok(got429, 'per-credential MCP rate limit enforced', `429 after ${n} calls this minute`);
r = await req('/api/agent/revoke', { method: 'POST' }); ok(r.status === 200, 'revoke');
r = await mcp(tok2, 'tools/list'); ok(r.status === 401 || r.status === 429, 'revoked credential rejected', String(r.status));
// 10. OTP attempt limit + one human per phone
r = await req('/api/auth/start', { method: 'POST', body: { phone } }); ok(r.status === 200 && r.data.existing_account === true, 'same phone maps to existing human (one per phone)');
const o2 = r.data; let last;
for (let i = 0; i < 6; i++) last = await req('/api/auth/verify', { method: 'POST', body: { otp_id: o2.otp_id, code: String((Number(o2.simulated_sms.code) + 1 + i) % 1000000).padStart(6, '0') } });
ok(last.status === 429, 'OTP locked after 5 wrong attempts', last.data.error);
r = await req('/api/auth/start', { method: 'POST', body: { phone: '+12025550101' } }); ok(r.status === 403, 'demo phone numbers cannot be claimed');
r = await req('/api/auth/start', { method: 'POST', body: { phone: '12345' } }); ok(r.status === 400, 'bad phone rejected');
console.log(`\n${pass} passed, ${fail} failed  (test human ${humanId})`);
process.exit(fail ? 1 : 0);
