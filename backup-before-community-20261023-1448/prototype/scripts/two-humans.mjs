// Two real (test) humans: A's agent proposes -> A approves -> B accepts -> contact revealed -> agent + human messages.
const BASE = process.argv[2];
function client() { let cookie = ''; return async (path, { method = 'GET', body, auth } = {}) => {
  const h = { 'content-type': 'application/json' }; if (cookie) h.cookie = cookie; if (auth) h.authorization = 'Bearer ' + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && sc.startsWith('__Host-')) cookie = sc.split(';')[0];
  return { status: r.status, data: await r.json().catch(() => null) }; }; }
async function signup(c, name) { const p = '+1555' + String(Math.floor(Math.random() * 9e6) + 1e6); let r = await c('/api/auth/start', { method: 'POST', body: { phone: p } });
  await c('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name } }); return (await c('/api/me')).data.human.id; }
const A = client(), B = client(); const out = [];
const aId = await signup(A, 'Test Alice'), bId = await signup(B, 'Test Bob');
await B('/api/me', { method: 'PATCH', body: { contact: 'bob-test@example.com' } });
const tokA = (await A('/api/agent', { method: 'POST', body: { name: 'Alice agent', provider: 'ChatGPT' } })).data.credential;
const mcp = (name, args) => A('/mcp', { method: 'POST', auth: tokA, body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } } });
let r = await mcp('propose_intro', { to_human_id: bId, reason: 'Testing intro flow between two test humans.' }); const iid = r.data.result.structuredContent.intro.id;
out.push(['proposed', r.data.result.structuredContent.intro.status]);
r = await B('/api/intros'); out.push(['recipient sees it before sender approval?', r.data.intros.some(i => i.id === iid)]);
r = await B(`/api/intros/${iid}/accept`, { method: 'POST' }); out.push(['recipient accept before sender approval', r.status]);
r = await A(`/api/intros/${iid}/approve`, { method: 'POST' }); out.push(['sender human approves', r.data.intro.status]);
r = await B(`/api/intros/${iid}/approve`, { method: 'POST' }); out.push(['recipient tries to approve (sender-only)', r.status]);
r = await A(`/api/intros/${iid}`); out.push(['contact before accept', r.data.intro.counterpart_contact ?? null]);
r = await B(`/api/intros/${iid}/accept`, { method: 'POST' }); out.push(['recipient human accepts', r.data.intro.status]);
r = await A(`/api/intros/${iid}`); out.push(['contact revealed to sender after both approve', r.data.intro.counterpart_contact]);
r = await mcp('send_message', { intro_id: iid, body: "Hi Bob — I'm Alice's AI agent." }); out.push(['agent send_message', r.data.result.structuredContent?.labeled_as]);
r = await B(`/api/intros/${iid}/messages`, { method: 'POST', body: { body: 'Hi, Bob the human here.' } }); out.push(['human message', r.status]);
r = await B(`/api/intros/${iid}`); out.push(['thread labels', r.data.messages.map(m => m.sender_label).join(' | ')]);
r = await (client())(`/api/intros/${iid}`); out.push(['anonymous can view private intro', r.status]);
for (const [k, v] of out) console.log(k.padEnd(48), v);
await A('/api/agent/revoke', { method: 'POST' });
