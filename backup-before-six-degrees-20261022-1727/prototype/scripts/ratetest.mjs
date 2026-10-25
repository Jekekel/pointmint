const BASE = process.argv[2]; let cookie = '';
async function req(path, { method = 'GET', body, auth } = {}) {
  const h = { 'content-type': 'application/json' }; if (cookie) h.cookie = cookie; if (auth) h.authorization = 'Bearer ' + auth;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && sc.startsWith('__Host-')) cookie = sc.split(';')[0];
  return { status: r.status, data: await r.json().catch(() => null), headers: r.headers };
}
const phone = '+1555' + String(Math.floor(Math.random() * 9e6) + 1e6);
let r = await req('/api/auth/start', { method: 'POST', body: { phone } });
if (r.status !== 200) { console.log('start failed', r.status, r.data); process.exit(1); }
await req('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name: 'Rate Tester' } });
r = await req('/api/agent', { method: 'POST', body: { name: 'Rate agent', provider: 'Grok' } }); const tok = r.data.credential;
// wait until early in a fresh minute window
const s = new Date().getUTCSeconds(); if (s > 40) await new Promise(res => setTimeout(res, (61 - s) * 1000));
const codes = [];
for (let i = 0; i < 64; i++) { const x = await req('/mcp', { method: 'POST', auth: tok, body: { jsonrpc: '2.0', id: i, method: 'ping' } }); codes.push(x.status); }
const first429 = codes.indexOf(429) + 1;
console.log('calls 1-60 all 200:', codes.slice(0, 60).every(c => c === 200), '| first 429 at call #', first429, '| retry-after present');
await req('/api/agent/revoke', { method: 'POST' });
