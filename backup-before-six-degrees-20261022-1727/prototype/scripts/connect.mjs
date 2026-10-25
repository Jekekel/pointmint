// Six degrees + reserved profiles + claim flow + opt-out + LinkedIn import: node scripts/connect.mjs https://host  (never prints credentials)
// Uses only FICTIONAL demo reserved profiles (rp_demo_*) for claims and removals; real public figures are only read.
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
    return { status: r.status, data, text, headers: r.headers };
  };
}
const anon = client();
async function person(name, { agent = true } = {}) {
  const c = client();
  const phone = '+1 (555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  let r = await c('/api/auth/start', { method: 'POST', body: { phone } });
  if (r.status !== 200) throw new Error(`start failed ${r.status} ${r.data?.error || ''}`);
  r = await c('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name, headline: '' } });
  if (r.status !== 200) throw new Error('verify failed ' + r.status);
  const me = (await c('/api/me')).data;
  let tok = null; if (agent) { r = await c('/api/agent', { method: 'POST', body: { name: name + "'s agent", provider: 'Claude' } }); tok = r.data.credential; }
  return { c, id: me.human.id, tok };
}
async function tool(who, name, args) {
  const r = await who.c('/mcp', { method: 'POST', auth: who.tok, body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } } });
  const res = r.data.result; let out = null; try { out = JSON.parse(res.content[0].text); } catch {}
  return { isError: !!(res && res.isError) || !!r.data.error, out };
}

// ---- paths ----
let r = await anon('/api/connect/path?to=' + encodeURIComponent('Elon Musk'));
const R = r.data;
ok(r.status === 200 && R.target && R.target.id === 'rp_elon_musk' && R.target.unclaimed, 'resolves a public figure by name to an unclaimed reserved profile');
ok(R.paths.length >= 1 && R.paths.length <= 3 && R.paths.every(p => p.hops_count <= 6), 'returns 1–3 paths, each ≤ 6 hops', R.paths.map(p => p.hops_count).join(','));
ok(R.paths.every(p => p.hops.every(h => h.edge.type && h.edge.why && h.edge.provenance && typeof h.edge.confidence === 'number' && h.edge.source)), 'every hop carries WHY: edge type, reason, provenance, confidence, source');
ok(R.paths.every(p => p.hops.filter(h => h.edge.provenance === 'public_source').every(h => /^https:\/\//.test(h.edge.source))), 'every public-source hop links its source URL');
ok(R.paths.every((p, i) => i === 0 || p.cost >= R.paths[i - 1].cost), 'paths ranked by cost (strongest first)');
ok(new Set(R.paths.map(p => p.nodes.join('>'))).size === R.paths.length, 'alternatives are distinct');
ok(R.target_notice && /not affiliated with or operated by this person/.test(R.target_notice), 'reserved target carries the unclaimed notice');
ok(R.paths.every(p => p.nodes.slice(1, -1).every(id => !id.startsWith('rp_'))), 'reserved profiles never relay a path (no agent, no messages)');
ok(Array.isArray(R.mutual) && Array.isArray(R.shared_context), 'mutual connections + shared context returned');
r = await anon('/api/connect/path?to=' + encodeURIComponent('Howard Schultz'));
ok(r.data.paths[0] && r.data.paths[0].hops.some(h => h.to.kind === 'industry' || h.from.kind === 'industry' || h.to.kind === 'company'), 'paths run through typed entities (company / industry / school …)');
// verified humans rank above public data: a path made of PointMint edges between demo members has lower cost per hop
r = await anon('/api/connect/path?to=h_d00003');
ok(r.data.paths[0] && r.data.paths[0].hops.some(h => h.edge.provenance === 'pointmint'), 'member-to-member paths prefer verified-human edges (intros, messages, matches)', r.data.paths[0]?.hops.map(h => h.edge.type).join('>'));
r = await anon('/api/connect/path?to=' + encodeURIComponent('Nobody Atall Xyz'));
ok(r.status === 200 && !r.data.target && r.data.paths.length === 0, 'unknown target → no path, no error');
r = await anon('/connect.md?to=' + encodeURIComponent('Elon Musk'), { accept: 'text/markdown' });
ok(r.status === 200 && /^# How am I connected\?/m.test(r.text) && /Path 1/.test(r.text) && /source: https:/.test(r.text), '/connect.md renders paths as Markdown with sources');
r = await anon('/api/connect/search?q=stri');
ok(r.data.results.some(x => x.id === 'company:stripe'), 'search finds entities too');

// ---- graph overlay ----
r = await anon('/graph.json'); const G = r.data;
const RP = G.nodes.filter(n => n.type === 'reserved');
ok(RP.length >= 25 && RP.length <= 50, '25–50 reserved public-figure profiles in the graph', String(RP.length));
ok(RP.every(n => !n.photo_url && !n.avatar_url && n.initials), 'reserved nodes: initials only, no photo or likeness');
ok(!G.nodes.some(n => n.type === 'agent' && RP.some(p => p.id === n.human_id)), 'reserved profiles have no agent');
ok(G.nodes.some(n => n.type === 'entity' && n.kind === 'school') && G.nodes.some(n => n.type === 'entity' && n.kind === 'industry') && G.nodes.some(n => n.type === 'entity' && n.kind === 'investor'), 'typed entity nodes: schools, industries, investors …');
ok(G.edges.filter(e => e.type === 'affil' && e.provenance === 'public_source').every(e => /^https:\/\//.test(e.source_url || '')), 'every public-source affiliation edge has a source URL');
ok(!JSON.stringify(G).includes('linkedin.com'), 'no LinkedIn-sourced data in the graph');

// ---- reserved profile pages: noindex, labeled, no agent, no messaging ----
r = await anon('/api/reserved/rp_elon_musk');
ok(r.status === 200 && r.data.profile.notice.startsWith('Unclaimed profile, built from public sources') && r.data.profile.has_agent === false && r.data.profile.can_message === false && r.data.facts.length >= 2 && r.data.facts.every(f => /^https:\/\//.test(f.source_url)), 'reserved profile: label, no agent, no messages, a source per fact');
r = await anon('/p/rp_elon_musk', { accept: 'text/html' });
ok(r.status === 200 && /noindex/.test(r.headers.get('x-robots-tag') || ''), '/p/<id> page is noindex');
r = await anon('/p/rp_elon_musk.md', { accept: 'text/markdown' });
ok(r.status === 200 && /noindex/.test(r.headers.get('x-robots-tag') || '') && /not affiliated with or operated by this person/.test(r.text), '/p/<id>.md is labeled and noindex');
r = await anon('/api/messages', { method: 'POST', body: { to_type: 'human', to_id: 'rp_elon_musk', body: 'hi' } });
ok(r.status >= 400, 'cannot message a reserved profile', String(r.status));

// ---- claim flow (fictional demo reserved profiles only) ----
const A = await person('Rowan Ashby', { agent: false });
r = await A.c('/api/reserved/rp_demo_rowan_ashby/claim', { method: 'POST', body: { legal_name: 'Robin Ashworth', id_document: 'simulated_pass', selfie: 'simulated_pass', attest: true } });
ok(r.status === 200 && r.data.claim.status === 'name_mismatch', 'name on ID must match the reserved record', r.data.claim?.status);
r = await A.c('/api/reserved/rp_demo_rowan_ashby/claim', { method: 'POST', body: { legal_name: 'Rowan Ashby', id_document: 'simulated_fail', selfie: 'simulated_pass', attest: true } });
ok(r.data.claim.status === 'rejected', 'failed (simulated) ID check rejects the claim');
r = await A.c('/api/reserved/rp_demo_rowan_ashby/claim', { method: 'POST', body: { legal_name: 'Rowan J. Ashby', id_document: 'simulated_pass', selfie: 'simulated_pass', attest: true } });
ok(r.data.claim.status === 'approved' && r.data.human.verify_level === 'L3' && r.data.agent && r.data.agent.created, 'L3 + name match → approved; profile converts to a verified human and their one agent is created');
r = await anon('/graph.json');
ok(!r.data.nodes.some(n => n.id === 'rp_demo_rowan_ashby') && r.data.nodes.some(n => n.id === A.id && n.type === 'human') && r.data.edges.some(e => e.type === 'affil' && e.source === A.id && e.target === 'company:demo-ashby'), 'hollow node becomes solid: the claimed facts now hang off the verified human');
ok(r.data.nodes.some(n => n.type === 'agent' && n.human_id === A.id), 'the new agent is tethered to the claimant');
r = await A.c('/api/me'); ok(r.data.human.level === 'L3', 'claimant is now L3');
r = await A.c('/api/audit'); const acts = r.data.entries.map(e => e.action);
ok(['claim.started', 'claim.l3_simulated', 'claim.name_mismatch', 'claim.rejected', 'claim.approved', 'reserved.converted', 'agent.created_on_claim'].every(a => acts.includes(a)), 'every claim step is in the audit log');
r = await A.c('/api/reserved/rp_demo_marisol_vega/claim', { method: 'POST', body: { legal_name: 'Marisol Vega', id_document: 'simulated_pass', selfie: 'simulated_pass', attest: true } });
ok(r.status === 409, 'one human, one claimed profile');
const B = await person('Marisol Vega');
r = await B.c('/api/reserved/rp_demo_marisol_vega/claim', { method: 'POST', body: { legal_name: 'Marisol Vega', id_document: 'simulated_pass', selfie: 'simulated_pass', attest: true } });
ok(r.data.claim.status === 'manual_review' && !r.data.human, 'high-profile name → manual review; nothing converts yet');
r = await anon('/api/reserved/rp_demo_marisol_vega'); ok(r.data.profile.status === 'claim_review', 'profile shows a claim under review');
r = await anon('/api/reserved/rp_demo_rowan_ashby/claim', { method: 'POST', body: { legal_name: 'x', attest: true } }); ok(r.status === 401, 'claiming needs a PointMint account');

// ---- opt-out / dispute ----
r = await anon('/api/reserved/rp_demo_rowan_ashby/request', { method: 'POST', body: { kind: 'dispute', relationship: 'other', requester_name: 'Launch check', reason: 'Test dispute (automated)' } });
ok(r.status === 200 && r.data.request.kind === 'dispute' && !r.data.request.hidden, 'dispute path recorded for review');
r = await anon('/api/reserved/rp_demo_theo_brandt/request', { method: 'POST', body: { kind: 'removal', relationship: 'self', requester_name: 'Launch check', reason: 'Test removal (automated)' } });
ok(r.status === 200 && r.data.request.hidden, 'removal request by the person hides the profile pending review');
r = await anon('/api/reserved/rp_demo_theo_brandt'); ok(r.status === 404, 'hidden profile is gone from pages');

// ---- LinkedIn import (consented, reviewed, own data) ----
r = await A.c('/api/me/import/linkedin', { method: 'POST', body: { positions: [{ company: 'Stripe', title: 'Partnerships', started: 'Mar 2019', finished: 'Jan 2023' }], education: [{ school: 'Stanford University', degree: 'MBA' }], skills: ['Payments'], source: 'linkedin_data_export_zip' } });
ok(r.status === 200 && r.data.imported.positions === 1 && r.data.imported.matched_existing_entities >= 2, 'import links to existing companies/schools', JSON.stringify(r.data.imported));
r = await A.c('/api/connect/path?to=rp_patrick_collison');
ok(r.data.paths[0] && r.data.paths[0].hops_count <= 2 && r.data.paths[0].hops.some(h => h.edge.provenance === 'member_import'), 'imported history creates new short paths (labeled member import)', r.data.paths[0]?.hops.map(h => h.to.label).join(' > '));
r = await anon('/graph.json'); ok(!r.data.edges.some(e => e.provenance === 'member_import'), 'imported data is members-only (not in the anonymous graph)');
r = await A.c('/api/audit'); ok(r.data.entries.some(e => e.action === 'import.linkedin_export'), 'import is audit-logged');
r = await A.c('/api/me/import/linkedin', { method: 'DELETE' }); ok(r.status === 200, 'imported data removable in one step');

// ---- agent side ----
const t = await tool(B, 'find_connection_path', { target: 'Elon Musk' });
ok(!t.isError && t.out && Array.isArray(t.out.paths) && t.out.target && t.out.target.id === 'rp_elon_musk' && t.out.from.id === B.id, 'MCP find_connection_path returns JSON paths from the agent’s own human');
r = await B.c('/api/messages', { method: 'POST', body: { to_type: 'human', to_id: 'rp_elon_musk', body: 'hi' } });
ok(r.status >= 400 && r.status < 500, 'a signed-in member cannot message a reserved profile', String(r.status));
const tm = await tool(B, 'find_connection_path', { target: 'Elon Musk', format: 'md' });
ok(!tm.isError && /# How am I connected/.test(tm.out.markdown), 'MCP find_connection_path returns Markdown');
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
