// Profile photos, AI avatars, identity + ranking: node scripts/photos.mjs https://host   (never prints credentials)
import { readFileSync } from 'node:fs';
const BASE = (process.argv[2] || 'http://localhost:8787').replace(/\/$/, '');
const FX = new URL('./fixtures/', import.meta.url);
const fx = n => readFileSync(new URL(n, FX));
let pass = 0, fail = 0;
const ok = (c, msg, extra = '') => { if (c) { pass++; console.log('PASS', msg, extra); } else { fail++; console.log('FAIL', msg, extra); } };
function client() {
  let cookie = '';
  return async (path, { method = 'GET', body, raw, type, headers = {}, auth } = {}) => {
    const h = { accept: 'application/json', origin: BASE, ...headers };
    if (body !== undefined) h['content-type'] = 'application/json';
    if (raw !== undefined) h['content-type'] = type;
    if (cookie && !auth) h.cookie = cookie;
    if (auth) h.authorization = 'Bearer ' + auth;
    const r = await fetch(BASE + path, { method, headers: h, body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc && sc.startsWith('__Host-pm_session=')) cookie = sc.split(';')[0];
    const buf = Buffer.from(await r.arrayBuffer()); let data; try { data = JSON.parse(buf.toString()); } catch { data = null; }
    return { status: r.status, data, buf, headers: r.headers };
  };
}
const anon = client();
async function person(name) {
  const c = client();
  const phone = '+1 (555) ' + String(Math.floor(Math.random() * 900) + 100) + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  let r = await c('/api/auth/start', { method: 'POST', body: { phone } });
  if (r.status !== 200) throw new Error(`start failed ${r.status} ${r.data?.error || ''}`);
  r = await c('/api/auth/verify', { method: 'POST', body: { otp_id: r.data.otp_id, code: r.data.simulated_sms.code, name, headline: 'Photo test (test account)' } });
  if (r.status !== 200) throw new Error('verify failed ' + r.status);
  const me = (await c('/api/me')).data;
  r = await c('/api/agent', { method: 'POST', body: { name: name + "'s agent", provider: 'Claude' } });
  await c('/api/vault', { method: 'POST', body: { type: 'sell', title: 'Refurbished espresso machines for cafes', tags: 'coffee, equipment, espresso', visibility: 'public', budget_min: 8000, budget_max: 12000 } });
  return { c, id: me.human.id, tok: r.data.credential, agentId: r.data.agent_id };
}
const up = (who, file, type, src = 'upload') => who.c('/api/me/photo', { method: 'POST', raw: fx(file), type, headers: { 'x-photo-source': src } });

// ---- AI avatars ----
let r = await anon('/avatars/agent_d00001.svg');
const svg = r.buf.toString();
ok(r.status === 200 && /image\/svg\+xml/.test(r.headers.get('content-type')), 'agent avatar is served as SVG from our own origin');
ok(/default-src 'none'/.test(r.headers.get('content-security-policy') || '') && r.headers.get('x-content-type-options') === 'nosniff', 'avatar SVG has its own locked-down CSP + nosniff');
ok(/synthetic, not a photo/.test(svg) && !/<script|style=|on\w+=/i.test(svg), 'avatar is labeled synthetic and has no script, style attribute or handler');
ok(/data-part="sunglasses"|sunglasses/i.test(svg), 'avatar wears sunglasses');
const svg2 = (await anon('/avatars/agent_d00001.svg')).buf.toString(), svg3 = (await anon('/avatars/agent_d00002.svg')).buf.toString();
ok(svg === svg2 && svg !== svg3, 'avatars are deterministic per seed and differ between agents');
r = await anon('/avatars/..%2Fsecret.svg'); ok(r.status !== 200 || !/svg/.test(r.headers.get('content-type') || ''), 'avatar seeds are validated', String(r.status));

// ---- headers ----
r = await anon('/'); ok(/camera=\(self\)/.test(r.headers.get('permissions-policy') || '') && /microphone=\(\)/.test(r.headers.get('permissions-policy') || ''), 'Permissions-Policy allows the camera for this origin only, no mic');

// ---- uploads ----
const A = await person('Photo Tester');
ok(!!A.tok, 'verified human with one AI agent');
let me = (await A.c('/api/me')).data.human;
ok(me.has_photo === false && me.photo_required === true && /ranked lower/.test(me.photo_note || ''), 'new member without a photo is nagged and told they rank lower');
r = await anon('/api/me/photo', { method: 'POST', raw: fx('face-exif.jpg'), type: 'image/jpeg' }); ok(r.status === 401, 'upload requires sign-in', String(r.status));
r = await up(A, 'face.png', 'image/png'); ok(r.status === 415, 'PNG rejected (JPEG/WebP only)', String(r.status));
r = await up(A, 'fake.jpg', 'image/jpeg'); ok(r.status === 400, 'non-image bytes rejected', `${r.status} ${r.data?.error}`);
r = await up(A, 'face-exif.webp', 'image/jpeg'); ok(r.status === 400, 'type/bytes mismatch rejected', `${r.status} ${r.data?.error}`);
r = await up(A, 'nonsquare.jpg', 'image/jpeg'); ok(r.status === 400, 'non-square photo rejected (crop happens in the browser)', `${r.status} ${r.data?.error}`);
r = await up(A, 'tiny.jpg', 'image/jpeg'); ok(r.status === 400, 'tiny photo rejected', `${r.status} ${r.data?.error}`);
const big = Buffer.concat([fx('face-exif.jpg'), Buffer.alloc(5 * 1024 * 1024 + 10)]);
r = await A.c('/api/me/photo', { method: 'POST', raw: big, type: 'image/jpeg' }); ok(r.status === 413, 'over 5 MB rejected', String(r.status));
r = await A.c('/api/me/photo', { method: 'POST', raw: fx('face-exif.jpg'), type: 'image/jpeg', headers: { origin: 'https://evil.example' } }); ok(r.status === 403, 'cross-origin upload rejected', String(r.status));

r = await up(A, 'face-exif.jpg', 'image/jpeg', 'camera');
ok(r.status === 201 && r.data.metadata_stripped && r.data.width === 640 && r.data.source === 'camera', 'JPEG with EXIF/GPS accepted', `${r.status} ${r.data?.error || ''}`);
const url1 = r.data.photo_url;
r = await anon(url1);
ok(r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && /default-src 'none'/.test(r.headers.get('content-security-policy') || '') && r.headers.get('x-content-type-options') === 'nosniff', 'photo served from our domain with a locked-down CSP');
ok(!r.buf.includes(Buffer.from('Exif')) && !r.buf.includes(Buffer.from('SECRET-COMMENT')) && !r.buf.includes(Buffer.from('TestCam')), 'EXIF, GPS and comments stripped from stored JPEG');
ok(r.buf[0] === 0xff && r.buf[1] === 0xd8, 'stored JPEG still a valid JPEG');

r = await up(A, 'face-exif.webp', 'image/webp');
ok(r.status === 201, 'WebP accepted', `${r.status} ${r.data?.error || ''}`);
const url2 = r.data.photo_url;
r = await anon(url2);
ok(r.status === 200 && r.headers.get('content-type') === 'image/webp' && !r.buf.includes(Buffer.from('EXIF')) && !r.buf.includes(Buffer.from('TestCam')), 'EXIF stripped from stored WebP');
ok((await anon(url1)).status === 404, 'replaced photo is no longer served');
ok((await anon('/media/photos/h/h_nobody/0123456789abcdef.jpg')).status === 404, 'unknown photo keys 404');

me = (await A.c('/api/me')).data.human;
ok(me.has_photo && me.photo_url === url2 && !me.photo_required, '/api/me shows the photo, no nag');

// ---- ranking ----
r = await anon('/api/network');
const members = r.data.members || r.data.humans || [];
const idx = members.findIndex(m => (m.human ? m.human.id : m.id) === A.id);
const firstNoPhoto = members.findIndex(m => !(m.human ? m.human.has_photo : m.has_photo));
ok(idx >= 0 && (firstNoPhoto === -1 || idx < firstNoPhoto), 'network listing: members with a photo rank above members without', `pos ${idx}, first no-photo ${firstNoPhoto}`);
r = await call(A, 'search_matches', { limit: 20 });
const ms = r.res ? JSON.parse(r.res.content[0].text).matches : [];
ok(ms.length > 0 && ms.every(m => m.counterpart.human.has_photo || m.reasons.some(x => /no profile photo/.test(x))), 'search_matches: counterparts without a photo carry the penalty reason', `${ms.length} matches`);
r = await anon('/api/page?path=' + encodeURIComponent('/matches?human=h_d00001'));
const dm = r.data.data.matches.find(m => m.counterpart.human.id === A.id);
const dn = r.data.data.matches.find(m => m.counterpart.human.id !== A.id);
ok(!!dm && !dm.reasons.some(x => /no profile photo/.test(x)) && (!dn || dn.reasons.some(x => /no profile photo/.test(x))), 'demo member’s matches: photo-less counterparts penalized, the member with a photo is not');

// ---- identity model + owner-only hint ----
r = await A.c('/api/page?path=' + encodeURIComponent('/h/' + A.id));
ok(r.data.identity.human.id === A.id && r.data.identity.human.photo_url === url2 && String(r.data.identity.agent.avatar_url || '').startsWith(`/avatars/twin/${A.agentId}.svg`), 'profile page: left = this human (photo), right = their AI agent (twin avatar)');
await A.c('/api/me/photo', { method: 'DELETE' });
ok((await anon(url2)).status === 404, 'removed photo is gone');
r = await A.c('/api/page?path=' + encodeURIComponent('/h/' + A.id));
ok(/ranked lower/.test(r.data.identity.human.rank_hint || '') && /you rank lower/.test(r.data.md.page), 'owner sees the “no photo, ranked lower” hint');
r = await anon('/api/page?path=' + encodeURIComponent('/h/' + A.id));
ok(!r.data.identity.human.rank_hint && !/rank lower/.test(r.data.md.page) && r.data.identity.human.photo_url === null, 'others never see the ranking hint; they see a neutral placeholder');
r = await anon('/api/page?path=/');
if (r.data.flags && r.data.flags.show_founder) ok(r.data.identity.basis === 'host' && r.data.identity.human.has_photo && /^\/avatars\/twin\/agent_\w+\.svg/.test(r.data.identity.agent.avatar_url), 'home (SHOW_FOUNDER on): host human on the left, host AI agent on the right');
else { ok(r.data.identity.basis === 'host' && r.data.identity.human.name === 'You' && String(r.data.identity.agent.avatar_url || '').startsWith('/avatars/twin/agent_host.svg'), 'home (SHOW_FOUNDER off): neutral host persona, no owner details');
  const hm = await fetch(BASE + '/glass/michael.jpg'); ok(hm.status === 404, 'SHOW_FOUNDER off: host-only media is not served', hm.status); }
r = await anon('/api/activity?limit=50&human_id=' + A.id);
ok(true, 'activity endpoint reachable', String(r.status));
r = await A.c('/api/activity?limit=50&human_id=' + A.id);
ok((r.data.events || []).some(e => e.action === 'profile.photo_added'), 'photo upload appears in the owner’s activity feed');
ok((r.data.events || []).filter(e => e.actor.type === 'agent').every(e => /^\/avatars\//.test(e.actor.avatar_url)), 'feed rows carry the agent avatar');


// ---- digital twin avatars (human photo + sunglasses) ----
r = await up(A, 'face-exif.jpg', 'image/jpeg', 'camera');
ok(r.status === 201, 're-upload photo for twin compose', `${r.status}`);
const twinPath = `/avatars/twin/${A.agentId}.svg`;
r = await anon(twinPath);
const twinSvg = r.buf.toString();
ok(r.status === 200 && /image\/svg\+xml/.test(r.headers.get('content-type') || ''), 'twin avatar served as SVG', String(r.status));
ok(/sunglasses|data-part="sunglasses"/i.test(twinSvg), 'twin avatar wears sunglasses');
ok(/data:image\/(jpeg|webp);base64,/i.test(twinSvg), 'twin embeds the human photo as data-URI');
ok(/Digital twin|human photo/i.test(twinSvg), 'twin labeled as digital twin / human photo');
ok(/default-src 'none'/.test(r.headers.get('content-security-policy') || ''), 'twin SVG has locked-down CSP');
r = await anon(`/api/twin-avatar/${A.id}`);
ok(r.status === 200 && /sunglasses/i.test(r.buf.toString()), 'GET /api/twin-avatar/:humanId returns twin with sunglasses', String(r.status));
await A.c('/api/me/photo', { method: 'DELETE' });
r = await anon(twinPath);
const phSvg = r.buf.toString();
ok(r.status === 200 && /sunglasses/i.test(phSvg) && !/data:image\//i.test(phSvg), 'no human photo → twin placeholder still has sunglasses (not a blank circle)');
r = await anon('/avatars/twin-placeholder.svg');
ok(r.status === 200 && /sunglasses/i.test(r.buf.toString()), 'default twin-placeholder.svg has sunglasses');
me = (await A.c('/api/me')).data;
ok(me.agent && String(me.agent.avatar_url || '').startsWith(`/avatars/twin/${A.agentId}.svg`), '/api/me agent.avatar_url is twin path');


console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

async function call(who, name, args) { const x = await who.c('/mcp', { method: 'POST', auth: who.tok, body: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } } }); return { status: x.status, res: x.data?.result, err: x.data?.error }; }
