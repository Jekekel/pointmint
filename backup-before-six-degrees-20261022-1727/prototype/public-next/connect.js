// PointMint · Six degrees: "How am I connected to…?", reserved (unclaimed) public-figure profiles + the claim flow,
// opt-out / dispute requests, and the consented LinkedIn import (data-export ZIP parsed in the browser; OIDC stubbed).
// Classic script loaded after app.js: shares its helpers (esc, api, icon, go, solo, routes…). CSP-safe: no inline styles.
'use strict';
const RESERVED_NOTICE = 'Unclaimed profile, built from public sources, not affiliated with or operated by this person';
const ENT_LABEL = { company: 'Company', school: 'School', investor: 'Investor', industry: 'Industry', event: 'Event', deal: 'Deal', skill: 'Skill', human: 'Member', reserved: 'Unclaimed profile' };
const PROV_SHORT = { pointmint: 'Verified humans', member: 'Member', member_import: 'Member import', demo: 'Demo data', public_source: 'Public source', system: 'PointMint' };
const initialsOf = n => String(n || '').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const hollow = (name, size = '') => `<span class="rp-glyph ${size}" aria-hidden="true">${esc(initialsOf(name))}</span>`;
const extLink = (u, label) => /^https:\/\//.test(u || '') ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer nofollow" class="src">${esc(label || new URL(u).hostname.replace(/^www\./, ''))}</a>` : `<span class="src t-dim">${esc(u && u.startsWith('pointmint:') ? 'PointMint record' : u || '')}</span>`;
function nodeChip(n) {
  if (!n) return '';
  const k = n.type === 'entity' ? n.kind : n.type;
  const ic = n.type === 'human' ? '<span class="id-dot h" aria-hidden="true"></span>' : n.type === 'reserved' ? hollow(n.label, 'xs') : `<span class="ent-dot e-${esc(k)}" aria-hidden="true"></span>`;
  const inner = `${ic}<span>${esc(plain(n.label))}</span>${n.type !== 'human' ? `<span class="t-dim">${esc(ENT_LABEL[k] || k)}</span>` : n.demo ? '<span class="t-dim">Demo</span>' : ''}`;
  const href = n.type === 'human' ? `/h/${n.id}` : n.type === 'reserved' ? `/p/${n.id}` : null;
  return href ? `<a class="nchip" href="${esc(href)}" data-link>${inner}</a>` : `<span class="nchip">${inner}</span>`;
}
function hopHtml(h, i) {
  const e = h.edge;
  return `<li class="hop"><span class="hop-n num" aria-hidden="true">${i + 1}</span><div class="hop-b">
    <p class="hop-ends">${nodeChip(h.from)}${icon('arrow', 'ic arrow')}${nodeChip(h.to)}</p>
    <p class="hop-why"><b>${esc(e.label)}</b> · ${esc(e.why || '')}</p>
    <p class="hop-meta"><span class="pv p-${esc(e.provenance)}">${esc(PROV_SHORT[e.provenance] || e.provenance)}</span><span class="num">confidence ${esc(Math.round((e.confidence || 0) * 100))}%</span>${e.href ? `<a href="${esc(e.href)}" data-link class="src">Open intro</a>` : extLink(e.source)}</p></div></li>`;
}
let CX = null;
function pathsHtml(R) {
  if (!R.target) return `<div class="panel pad"><p>${esc(R.note || 'No match.')}</p>${(R.candidates || []).length ? `<p class="small muted">Did you mean: ${R.candidates.map(c => `<a href="/connect?to=${encodeURIComponent(c.id)}" data-link>${esc(plain(c.label))}</a>`).join(', ')}</p>` : ''}</div>`;
  const t = R.target;
  const head = `<div class="cx-ends">${nodeChip(R.from)}<span class="cx-deg num">${R.paths.length ? esc(R.paths[0].hops_count) + '°' : '—'}</span>${nodeChip(t)}</div>
    ${t.unclaimed ? `<p class="rp-note" role="note">${icon('info')}<span>${esc(RESERVED_NOTICE)}. No AI agent; can’t be messaged.</span></p>` : ''}`;
  if (!R.paths.length) return head + `<div class="panel pad"><p>${esc(R.note || 'No path found.')}</p></div>`;
  const tabs = `<div class="cx-tabs" role="tablist" aria-label="Alternative paths">${R.paths.map((p, i) => `<button type="button" role="tab" id="cxt-${i}" aria-controls="cxp-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-action="cx-path" data-i="${i}"><b>Path ${p.rank}</b><span class="num">${p.hops_count} hop${p.hops_count === 1 ? '' : 's'} · ${p.strength}/100</span><span class="cx-mix">${p.verified_human_hops ? `<i class="vh">${p.verified_human_hops} verified</i>` : ''}${p.public_data_hops ? `<i class="pd">${p.public_data_hops} public</i>` : ''}</span></button>`).join('')}</div>`;
  const panels = R.paths.map((p, i) => `<div class="hops-p" role="tabpanel" id="cxp-${i}" aria-labelledby="cxt-${i}" ${i ? 'hidden' : ''}><ol class="hops">${p.hops.map(hopHtml).join('')}</ol></div>`).join('');
  const mutual = R.mutual.length || R.shared_context.length ? `<section class="m-sec">${groupLabel('Mutual connections', 'Shared with both of you')}<ul class="mutual">${R.mutual.map(m => `<li><span class="ent-dot e-${esc(m.type)}" aria-hidden="true"></span><b>${esc(plain(m.name))}</b><span class="t-dim">${esc(ENT_LABEL[m.type] || m.type)}</span><span class="mw">You: ${esc(m.you)} · Them: ${esc(m.them)}</span></li>`).join('')}${R.shared_context.map(m => `<li class="ctx"><span class="ent-dot e-${esc(m.type)}" aria-hidden="true"></span><b>${esc(m.name)}</b><span class="t-dim">${esc(ENT_LABEL[m.type] || m.type)} · on a path</span></li>`).join('')}</ul></section>` : '';
  return head + tabs + panels + mutual + `<p class="foot-note section-gap">${icon('info')}${esc(R.ranking)} <a href="/connect.md?to=${encodeURIComponent(t.id)}">.md</a> · <a href="/api/connect/path?to=${encodeURIComponent(t.id)}">JSON</a></p>`;
}
function connectForm(v = '') {
  return `<form id="connectForm" class="cx-form" role="search" autocomplete="off"><label for="cxq" class="cx-label">How am I connected to…?</label>
    <div class="cx-input">${icon('search')}<input id="cxq" name="to" type="search" value="${esc(v)}" placeholder="Try Elon Musk, Stripe, Stanford…" role="combobox" aria-expanded="false" aria-controls="cxList" aria-autocomplete="list" required maxlength="80"><button class="btn small">Find paths</button></div>
    <ul id="cxList" role="listbox" aria-label="People and entities" hidden></ul></form>`;
}
solo.connect = async () => {
  const to = new URLSearchParams(location.search).get('to') || '';
  CX = null; let body = '';
  if (to) { try { CX = await api('/api/connect/path?to=' + encodeURIComponent(to)); body = pathsHtml(CX); } catch (e) { body = err(e); } }
  else body = `<div class="cx-try"><p class="small muted">Up to 6 hops, top 3 alternatives. Every hop says WHY, with its source. Paths through verified humans rank above public-data links.</p><p class="cx-sugg">${['Elon Musk', 'Howard Schultz', 'Patrick Collison', 'Stanford University', 'Rowan Ashby'].map(n => `<a href="/connect?to=${encodeURIComponent(n)}" data-link>${esc(n)}</a>`).join('')}</p></div>`;
  POST_RENDER = () => { if (CX && CX.paths && CX.paths[0] && window.PMGraph) PMGraph.showPath(CX.paths[0].nodes); else if (window.PMGraph) PMGraph.showPath(null); };
  const from = CX && CX.from ? `<p class="small muted cx-from">${ME && ME.signed_in ? 'From you' : 'Viewing as demo member Dana Reyes. <a href="/signup" data-link>Sign in</a> to start from yourself.'}</p>` : '';
  return `<div class="page cx">${connectForm(to)}${from}${body}</div>`;
};

// ---------- reserved profile + claim + requests ----------
solo.reserved = async id => {
  let d; try { d = await api('/api/reserved/' + encodeURIComponent(id)); } catch (e) { return `<div class="page">${head('Unclaimed profile', 'Profile not available.', e.status === 404 ? 'It was removed, hidden pending review, or never existed.' : esc(e.message))}</div>`; }
  const p = d.profile;
  POST_RENDER = () => { if (window.PMGraph) { PMGraph.showPath(null); PMGraph.fly(p.id); } };
  if (p.status === 'claimed' && d.claimed_by) { go('/h/' + d.claimed_by); return ''; }
  const mine = (d.my_claims || [])[0];
  const claimState = p.status === 'claim_review' ? `<p class="rp-state" role="status">${icon('info')}<span>A claim is under manual review. Nothing changes until a reviewer decides.</span></p>` : '';
  return `<div class="page rp">
    <header class="rp-head">${hollow(p.name, 'xl')}<div><p class="eyebrow">Unclaimed profile${p.demo ? ' · Fictional demo' : ''}</p><h1 class="title">${esc(p.name)}</h1><p class="lede-sm">${esc(p.title)}</p>
      <p class="rp-badges"><span class="badge rp-b">${icon('info')}Unclaimed</span><span class="badge sys">No AI agent</span><span class="badge sys">Can’t be messaged</span></p></div></header>
    <p class="rp-note" role="note">${icon('info')}<span><b>${esc(RESERVED_NOTICE)}.</b> Built only from public, non-sensitive facts, each with its source. No photo or likeness. Hidden from search engines until claimed.</span></p>
    ${claimState}
    <div class="rp-actions"><a class="btn small" href="/connect?to=${encodeURIComponent(p.id)}" data-link>How am I connected?</a>${p.status === 'unclaimed' ? `<button type="button" class="btn small secondary" data-action="claim-open">Claim this profile</button>` : ''}<a class="btn small secondary" href="#request">Request removal or dispute</a></div>
    <section class="m-sec">${groupLabel('Public facts', `Sources checked ${esc(p.retrieved_at)}`)}<ul class="facts panel rows">${d.facts.map(f => `<li><span class="ent-dot e-${esc(f.entity.type)}" aria-hidden="true"></span><div><p>${esc(f.text)}</p><p class="small t-dim">${esc(ENT_LABEL[f.entity.type] || f.entity.type)} · ${esc(f.entity.name)} · ${esc(PROV_SHORT[f.provenance] || f.provenance)} · ${extLink(f.source_url)}</p></div></li>`).join('')}</ul>
      <p class="small muted">Profile source: ${extLink(p.source_url)} · Never sourced from LinkedIn.</p></section>
    <section class="m-sec" id="claim" ${p.status === 'unclaimed' ? 'hidden' : 'hidden'}>${claimHtml(p, mine)}</section>
    ${mine ? `<p class="small muted">Your last claim: <b>${esc(mine.status.replace(/_/g, ' '))}</b> · ${esc(when(mine.created_at))}</p>` : ''}
    <section class="m-sec" id="request">${groupLabel('Removal, correction or dispute', 'Reviewed by a person')}
      <form id="rpRequest" class="panel pad" data-id="${esc(p.id)}"><div class="fields two"><div><label for="rq-kind">Request</label><select id="rq-kind" name="kind"><option value="removal">Remove this profile</option><option value="correction">Correct a fact</option><option value="dispute">Dispute a claim</option></select></div>
        <div><label for="rq-rel">You are</label><select id="rq-rel" name="relationship"><option value="self">This person</option><option value="representative">Their representative</option><option value="other">Someone else</option></select></div></div>
        <div class="fields two section-gap-sm"><div><label for="rq-name">Your name</label><input id="rq-name" name="requester_name" maxlength="120"></div><div><label for="rq-contact">How to reach you</label><input id="rq-contact" name="contact" maxlength="160" placeholder="Email or phone (kept private)"></div></div>
        <div class="fields section-gap-sm"><div><label for="rq-reason">Details</label><textarea id="rq-reason" name="reason" maxlength="2000"></textarea></div></div>
        <div class="form-actions"><button class="btn small">Send request</button><span class="small muted">A removal request from the person (or their representative) hides the profile right away while we review.</span></div></form></section>
  </div>`;
};
function claimHtml(p) {
  if (!ME || !ME.signed_in) return `${groupLabel('Claim this profile')}<div class="panel pad"><p>Claiming needs a PointMint account first (phone verification), then full L3 identity verification.</p><div class="form-actions"><a class="btn small" href="/signup" data-link>Sign in or create an account</a></div></div>`;
  return `${groupLabel('Claim this profile', 'L3 identity verification')}
  <form id="claimForm" class="panel pad claim" data-id="${esc(p.id)}">
    <ol class="cl-steps"><li><b>ID document.</b> Prototype: simulated, nothing is uploaded or stored. A KYC vendor is TBD.</li><li><b>Selfie liveness check.</b> Simulated.</li><li><b>Name match</b> between your ID and “${esc(p.name)}”.</li><li>${p.high_profile ? '<b>Manual review</b>: a high-profile name, so a person confirms the claim.' : '<b>Approve</b>: the profile becomes your verified profile, your one AI agent is created, and the hollow node turns solid.'}</li></ol>
    <div class="fields two section-gap-sm"><div><label for="cl-legal">Legal name on your ID</label><input id="cl-legal" name="legal_name" required minlength="2" maxlength="120" autocomplete="name"></div>
      <div><label for="cl-id">ID document (simulated)</label><select id="cl-id" name="id_document"><option value="simulated_pass">Simulate: ID check passes</option><option value="simulated_fail">Simulate: ID check fails</option></select></div></div>
    <div class="fields two section-gap-sm"><div><label for="cl-selfie">Selfie (simulated)</label><select id="cl-selfie" name="selfie"><option value="simulated_pass">Simulate: liveness passes</option><option value="simulated_fail">Simulate: liveness fails</option></select></div>
      <div class="chk"><input type="checkbox" id="cl-attest" name="attest" value="yes" required><label for="cl-attest">I am this person. Impersonation is prohibited and logged.</label></div></div>
    <div class="form-actions"><button class="btn small">Verify and claim</button><span class="small muted">Every step is written to your audit log.</span></div><div id="claimOut" aria-live="polite"></div></form>`;
}
function claimResult(r) {
  const c = r.claim, ok = c.status === 'approved';
  const txt = { approved: 'Claimed. You’re now an L3 verified human.', manual_review: 'Submitted for manual review.', name_mismatch: 'Name doesn’t match.', rejected: 'Verification didn’t pass.' }[c.status] || c.status;
  return `<div class="claim-res ${ok ? 'ok' : c.status === 'manual_review' ? 'wait' : 'bad'}" role="status"><p><b>${esc(txt)}</b> ${esc(c.note)}</p>
    <p class="small t-dim">ID: ${esc(c.id_check)} · Selfie: ${esc(c.selfie_check)} · Name match: ${esc(Math.round(c.name_match * 100))}%</p>
    ${ok ? `<div class="form-actions"><a class="btn small" href="${esc(r.human.href)}" data-link>Open your profile</a>${r.agent ? `<a class="btn small secondary" href="${esc(r.agent.href)}" data-link>${r.agent.created ? 'Your new AI agent' : 'Your AI agent'}</a>` : ''}<a class="btn small ghost" href="/import" data-link>Import from LinkedIn (optional)</a></div>` : ''}</div>`;
}

// ---------- LinkedIn import: official OIDC (stub) or the member's own data-export ZIP, reviewed before saving ----------
let IMPORT = null;
solo.import = async () => {
  if (!ME || !ME.signed_in) { go('/signup'); return ''; }
  POST_RENDER = () => { if (window.PMGraph) PMGraph.showPath(null); };
  return `<div class="page imp">${head('Optional', 'Bring your LinkedIn history.', 'Only with your consent, only your own data. Nothing is saved until you review it. PointMint never scrapes LinkedIn.')}
    <section class="m-sec">${groupLabel('Sign in with LinkedIn', 'Official OpenID Connect')}<div class="panel pad"><p>LinkedIn’s official sign-in shares your name, email and photo. It does not share positions or education, so the export below is the way to bring those.</p>
      <div class="form-actions"><button type="button" class="btn small secondary li-btn" data-action="li-stub">Sign in with LinkedIn</button><span class="badge sys">Prototype stub · not connected to LinkedIn</span></div><div id="liOut" aria-live="polite"></div></div></section>
    <section class="m-sec">${groupLabel('Upload your LinkedIn data export', 'Parsed in your browser')}<div class="panel pad">
      <ol class="cl-steps small"><li>On LinkedIn: Settings → Data privacy → Get a copy of your data.</li><li>Download the ZIP and choose it here. We read <code>Positions.csv</code>, <code>Education.csv</code> and <code>Skills.csv</code> in your browser. The ZIP never leaves your device.</li><li>Untick anything you don’t want, then save to your vault and graph.</li></ol>
      <label class="btn small secondary file-btn" for="liZip">${icon('upload')}Choose ZIP</label><input id="liZip" type="file" accept=".zip,application/zip" class="sr-only">
      <div id="impReview" aria-live="polite"></div></div></section>
    <p class="foot-note">${icon('shield')}Imported facts are labeled “member import (self-reported)”, shown to signed-in members, and can be removed in one step. <button type="button" class="linkish" data-action="imp-remove">Remove everything I imported</button></p></div>`;
};
async function unzip(buf) {
  const v = new DataView(buf), out = {};
  let e = -1; for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('That file is not a ZIP archive.');
  let p = v.getUint32(e + 16, true); const n = v.getUint16(e + 10, true);
  for (let k = 0; k < n && p + 46 <= buf.byteLength; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(new Uint8Array(buf, p + 46, nl)); p += 46 + nl + xl + cl;
    const base = name.split('/').pop();
    if (!/^(Positions|Education|Skills)\.csv$/i.test(base)) continue;
    const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), data = new Uint8Array(buf, ds, csize);
    let bytes;
    if (method === 0) bytes = data;
    else if (method === 8) bytes = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else continue;
    if (bytes.length > 5e6) continue;
    out[base.toLowerCase()] = new TextDecoder().decode(bytes);
  }
  return out;
}
function csv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; } else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
function table(text, firstCol) {
  const rows = csv(text || ''); const h = rows.findIndex(r => r[0] && r[0].trim().toLowerCase() === firstCol.toLowerCase());
  if (h < 0) return [];
  const cols = rows[h].map(x => x.trim());
  return rows.slice(h + 1).map(r => Object.fromEntries(cols.map((c, i) => [c, (r[i] || '').trim()])));
}
async function parseExport(file) {
  if (file.size > 60e6) throw new Error('That ZIP is larger than 60 MB.');
  const files = await unzip(await file.arrayBuffer());
  const positions = table(files['positions.csv'], 'Company Name').map(r => ({ company: r['Company Name'], title: r['Title'], started: r['Started On'], finished: r['Finished On'] })).filter(x => x.company);
  const education = table(files['education.csv'], 'School Name').map(r => ({ school: r['School Name'], degree: r['Degree Name'], started: r['Start Date'], finished: r['End Date'] })).filter(x => x.school);
  const skills = table(files['skills.csv'], 'Name').map(r => r['Name']).filter(Boolean);
  if (!positions.length && !education.length && !skills.length) throw new Error('No Positions.csv, Education.csv or Skills.csv found in that ZIP.');
  return { positions: positions.slice(0, 50), education: education.slice(0, 30), skills: skills.slice(0, 80) };
}
function reviewHtml(D) {
  const li = (k, i, label, sub) => `<li><input type="checkbox" id="im-${k}-${i}" data-k="${k}" data-i="${i}" checked><label for="im-${k}-${i}"><b>${esc(label)}</b>${sub ? `<span class="t-dim">${esc(sub)}</span>` : ''}</label></li>`;
  return `<form id="importForm" class="imp-review section-gap-sm"><p class="small">Review what we found. Untick anything you don’t want saved.</p>
    ${D.positions.length ? `<fieldset><legend>Positions <span class="num t-dim">${D.positions.length}</span></legend><ul>${D.positions.map((p, i) => li('positions', i, p.company, [p.title, [p.started, p.finished || 'present'].filter(Boolean).join(' – ')].filter(Boolean).join(' · '))).join('')}</ul></fieldset>` : ''}
    ${D.education.length ? `<fieldset><legend>Education <span class="num t-dim">${D.education.length}</span></legend><ul>${D.education.map((p, i) => li('education', i, p.school, p.degree)).join('')}</ul></fieldset>` : ''}
    ${D.skills.length ? `<fieldset><legend>Skills <span class="num t-dim">${D.skills.length}</span></legend><ul class="sk">${D.skills.map((s, i) => li('skills', i, s, '')).join('')}</ul></fieldset>` : ''}
    <div class="form-actions"><button class="btn small">Save to my vault and graph</button><span class="small muted">Labeled self-reported. You can remove it any time.</span></div><div id="impOut" aria-live="polite"></div></form>`;
}

// ---------- events ----------
let cxTimer = 0;
document.addEventListener('input', ev => {
  if (ev.target.id !== 'cxq') return;
  clearTimeout(cxTimer); const q = ev.target.value.trim(), list = document.getElementById('cxList');
  if (q.length < 2) { list.hidden = true; ev.target.setAttribute('aria-expanded', 'false'); return; }
  cxTimer = setTimeout(async () => {
    try { const r = await api('/api/connect/search?q=' + encodeURIComponent(q));
      list.innerHTML = r.results.map((n, i) => `<li role="option" id="cxo-${i}" data-id="${esc(n.id)}" aria-selected="false">${nodeChip(n).replace(/<a [^>]*>|<\/a>/g, '')}</li>`).join('');
      list.hidden = !r.results.length; ev.target.setAttribute('aria-expanded', String(!!r.results.length)); } catch {}
  }, 160);
});
document.addEventListener('keydown', ev => {
  if (ev.target.id !== 'cxq') return;
  const list = document.getElementById('cxList'), opts = [...list.querySelectorAll('[role=option]')]; let i = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
  if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && opts.length && !list.hidden) { ev.preventDefault(); i = (i + (ev.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i))); ev.target.setAttribute('aria-activedescendant', opts[i].id); }
  else if (ev.key === 'Enter' && i >= 0 && !list.hidden) { ev.preventDefault(); go('/connect?to=' + encodeURIComponent(opts[i].dataset.id)); }
  else if (ev.key === 'Escape') { list.hidden = true; }
});
document.addEventListener('click', async ev => {
  const o = ev.target.closest('#cxList [role=option]'); if (o) { go('/connect?to=' + encodeURIComponent(o.dataset.id)); return; }
  const b = ev.target.closest('[data-action]'); if (!b) return;
  const act = b.dataset.action;
  if (act === 'cx-path' && CX) {
    const i = Number(b.dataset.i);
    document.querySelectorAll('.cx-tabs [role=tab]').forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; document.getElementById('cxp-' + k).hidden = k !== i; });
    if (window.PMGraph) PMGraph.showPath(CX.paths[i].nodes);
  } else if (act === 'claim-open') { const s = document.getElementById('claim'); s.hidden = false; s.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); const f = document.getElementById('cl-legal'); if (f) f.focus(); }
  else if (act === 'li-stub') { document.getElementById('liOut').innerHTML = `<p class="small section-gap-sm" role="status">${icon('info')}Prototype stub. In production this button starts LinkedIn’s official OpenID Connect flow (scopes <code>openid profile email</code>) and returns to PointMint with your consent. No request was made to LinkedIn.</p>`; }
  else if (act === 'imp-remove') { if (!await ask({ title: 'Remove imported LinkedIn data?', message: 'Positions, schools and skills you imported are removed from your graph.', ok: 'Remove', destructive: true })) return; await api('/api/me/import/linkedin', { method: 'DELETE' }); if (window.PMGraph) PMGraph.refresh(); await ask({ title: 'Removed', message: 'Your imported LinkedIn data is gone.', cancel: null }); }
});
document.addEventListener('change', async ev => {
  if (ev.target.id !== 'liZip' || !ev.target.files[0]) return;
  const box = document.getElementById('impReview'); box.innerHTML = '<p class="small muted" role="status">Reading your export…</p>';
  try { IMPORT = await parseExport(ev.target.files[0]); box.innerHTML = reviewHtml(IMPORT); } catch (e) { box.innerHTML = err(e); }
});
document.addEventListener('submit', async ev => {
  const f = ev.target; if (!['connectForm', 'claimForm', 'rpRequest', 'importForm'].includes(f.id)) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  const btn = f.querySelector('button'); if (btn) btn.disabled = true;
  const data = Object.fromEntries(new FormData(f).entries());
  try {
    if (f.id === 'connectForm') { go('/connect?to=' + encodeURIComponent(data.to)); return; }
    if (f.id === 'claimForm') {
      const r = await api(`/api/reserved/${f.dataset.id}/claim`, { method: 'POST', body: { legal_name: data.legal_name, id_document: data.id_document, selfie: data.selfie, attest: data.attest === 'yes' } });
      document.getElementById('claimOut').innerHTML = claimResult(r);
      if (r.claim.status === 'approved') { await loadMe(); try { MODEL = await api('/api/page?path=/activity'); document.getElementById('colL').innerHTML = humanColumn(MODEL); document.getElementById('colR').innerHTML = rightColumn(MODEL); lastSubject = null; pop(document.getElementById('colL'), 'l'); pop(document.getElementById('colR'), 'r'); } catch {} if (window.PMGraph) { await PMGraph.refresh(); PMGraph.fly(r.human.id); } }
    }
    if (f.id === 'rpRequest') { const r = await api(`/api/reserved/${f.dataset.id}/request`, { method: 'POST', body: data }); f.innerHTML = `<p role="status">${icon('approve')}${esc(r.message)}</p>`; if (r.request.hidden && window.PMGraph) PMGraph.refresh(); }
    if (f.id === 'importForm') {
      const pick = k => [...f.querySelectorAll(`input[data-k="${k}"]:checked`)].map(x => IMPORT[k][Number(x.dataset.i)]);
      const r = await api('/api/me/import/linkedin', { method: 'POST', body: { positions: pick('positions'), education: pick('education'), skills: pick('skills'), source: 'linkedin_data_export_zip' } });
      document.getElementById('impOut').innerHTML = `<p role="status" class="section-gap-sm">${icon('approve')}Saved ${r.imported.positions} positions, ${r.imported.schools} schools and ${r.imported.skills} skills. ${r.imported.matched_existing_entities} matched companies or schools already in the graph. <a href="/connect" data-link>See how you’re connected</a></p>`;
      if (window.PMGraph) PMGraph.refresh();
    }
  } catch (e) { let box = f.querySelector('.err'); if (!box) { box = document.createElement('div'); box.className = 'err'; box.setAttribute('role', 'alert'); f.appendChild(box); } box.textContent = e.message; }
  finally { if (btn) btn.disabled = false; }
}, true);
routes.push([/^\/connect\/?$/, 'connect'], [/^\/p\/(rp_[a-z0-9_]+)\/?$/, 'reserved'], [/^\/import\/?$/, 'import']);
Object.assign(TITLES, { connect: 'How am I connected?', reserved: 'Unclaimed profile', import: 'Import from LinkedIn' });
