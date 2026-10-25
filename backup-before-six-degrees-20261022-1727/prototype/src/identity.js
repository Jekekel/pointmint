// Identity: AI-agent avatars (synthetic, always wearing sunglasses) and human profile photos (R2).
// Human = warm, real photo. AI agent = cool, generated SVG. Nothing here is user-controlled markup.

// ---------- deterministic PRNG ----------
function fnv1a(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
function rng(seed) { let a = fnv1a(String(seed)) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// Cool hues only, so an agent can never be mistaken for the warm "human" color.
export const AGENT_HUES = [174, 186, 198, 210, 222, 234, 248, 262, 276];
export function agentHue(seed) { return AGENT_HUES[fnv1a('hue:' + seed) % AGENT_HUES.length]; }

export function agentAvatarSvg(seed, { size = 128 } = {}) {
  const r = rng(seed), hue = agentHue(seed), id = 'a' + (fnv1a(seed) % 1e8).toString(36);
  const acc = `hsl(${hue} 92% 64%)`, accSoft = `hsl(${hue} 90% 70%)`;
  const head = pick(r, ['box', 'oval', 'capsule', 'hex']);
  const shades = pick(r, ['wayfarer', 'visor', 'aviator', 'round']);
  const extra = pick(r, ['antenna', 'bolts', 'antenna2', 'crest']);
  const mouth = pick(r, ['bar', 'dots', 'wave']);
  const circuit = r() < 0.6;
  const metalA = `hsl(${hue} 16% 78%)`, metalB = `hsl(${hue} 18% 50%)`;
  const p = [];
  p.push(`<defs><linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 48% 19%)"/><stop offset="1" stop-color="hsl(${hue} 55% 7%)"/></linearGradient>`
    + `<radialGradient id="${id}glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="${acc}" stop-opacity="0.45"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient>`
    + `<linearGradient id="${id}metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${metalA}"/><stop offset="1" stop-color="${metalB}"/></linearGradient>`
    + `<linearGradient id="${id}lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2430"/><stop offset="0.55" stop-color="#05070b"/><stop offset="1" stop-color="hsl(${hue} 60% 22%)"/></linearGradient></defs>`);
  p.push(`<rect width="128" height="128" rx="28" fill="url(#${id}bg)"/>`);
  // faint scanlines: reads as a rendering, not a photograph
  for (let y = 10; y < 128; y += 8) p.push(`<rect x="0" y="${y}" width="128" height="1" fill="${acc}" opacity="0.06"/>`);
  p.push(`<circle cx="64" cy="56" r="52" fill="url(#${id}glow)"/>`);
  // shoulders + neck
  p.push(`<path d="M14 128 C18 104 38 95 64 95 C90 95 110 104 114 128 Z" fill="hsl(${hue} 30% 22%)"/>`);
  p.push(`<path d="M30 128 C34 112 46 106 64 106 C82 106 94 112 98 128" fill="none" stroke="${acc}" stroke-width="1.5" opacity="0.55"/>`);
  p.push(`<rect x="55" y="84" width="18" height="16" rx="4" fill="${metalB}"/>`);
  // extras behind the head
  if (extra === 'antenna') p.push(`<line x1="64" y1="22" x2="64" y2="9" stroke="${metalA}" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="8" r="4.5" fill="${acc}"/>`);
  if (extra === 'antenna2') p.push(`<line x1="48" y1="25" x2="40" y2="11" stroke="${metalA}" stroke-width="2.5" stroke-linecap="round"/><line x1="80" y1="25" x2="88" y2="11" stroke="${metalA}" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="10" r="3.5" fill="${acc}"/><circle cx="88" cy="10" r="3.5" fill="${acc}"/>`);
  if (extra === 'crest') p.push(`<path d="M50 24 L64 10 L78 24 Z" fill="${acc}" opacity="0.9"/>`);
  // head
  const H = { box: `<rect x="33" y="22" width="62" height="68" rx="20" fill="url(#${id}metal)"/>`, oval: `<ellipse cx="64" cy="56" rx="31" ry="35" fill="url(#${id}metal)"/>`,
    capsule: `<rect x="35" y="20" width="58" height="72" rx="29" fill="url(#${id}metal)"/>`, hex: `<path d="M64 20 L94 36 L94 74 L64 92 L34 74 L34 36 Z" fill="url(#${id}metal)" stroke-linejoin="round"/>` }[head];
  p.push(H);
  // face-plate seam + highlight
  p.push(`<path d="M42 34 Q64 26 86 34" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.35" stroke-linecap="round"/>`);
  if (extra === 'bolts') p.push(`<circle cx="31" cy="58" r="5" fill="${metalB}"/><circle cx="31" cy="58" r="2.2" fill="${acc}"/><circle cx="97" cy="58" r="5" fill="${metalB}"/><circle cx="97" cy="58" r="2.2" fill="${acc}"/>`);
  if (circuit) p.push(`<path d="M86 66 h6 v8 h4" fill="none" stroke="${acc}" stroke-width="1.4" opacity="0.8"/><circle cx="96" cy="74" r="1.6" fill="${acc}"/><path d="M42 68 h-6 v6" fill="none" stroke="${acc}" stroke-width="1.4" opacity="0.6"/>`);
  // sunglasses: always present
  const temples = `<path d="M33 52 L28 50 M95 52 L100 50" stroke="#0a0d12" stroke-width="3" stroke-linecap="round"/>`;
  const glint = (x, y) => `<path d="M${x} ${y} l7 -5" stroke="${accSoft}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>`;
  if (shades === 'wayfarer') p.push(temples + `<path d="M35 47 H61 L59 61 Q58 65 54 65 H42 Q38 65 37 61 Z" fill="url(#${id}lens)" stroke="#0a0d12" stroke-width="2.5" stroke-linejoin="round"/><path d="M67 47 H93 L91 61 Q90 65 86 65 H74 Q70 65 69 61 Z" fill="url(#${id}lens)" stroke="#0a0d12" stroke-width="2.5" stroke-linejoin="round"/><rect x="60" y="48" width="8" height="3" rx="1.5" fill="#0a0d12"/>` + glint(41, 58) + glint(73, 58));
  if (shades === 'visor') p.push(temples + `<rect x="32" y="46" width="64" height="18" rx="9" fill="url(#${id}lens)" stroke="#0a0d12" stroke-width="2.5"/><rect x="36" y="53" width="56" height="2" rx="1" fill="${acc}" opacity="0.85"/>` + glint(42, 61));
  if (shades === 'aviator') p.push(temples + `<path d="M36 48 Q48 44 60 48 Q61 60 50 65 Q38 64 36 48 Z" fill="url(#${id}lens)" stroke="${metalA}" stroke-width="2"/><path d="M68 48 Q80 44 92 48 Q90 64 78 65 Q67 60 68 48 Z" fill="url(#${id}lens)" stroke="${metalA}" stroke-width="2"/><path d="M60 48 Q64 45 68 48" fill="none" stroke="${metalA}" stroke-width="2"/>` + glint(42, 59) + glint(74, 59));
  if (shades === 'round') p.push(temples + `<circle cx="49" cy="55" r="11" fill="url(#${id}lens)" stroke="#0a0d12" stroke-width="2.5"/><circle cx="79" cy="55" r="11" fill="url(#${id}lens)" stroke="#0a0d12" stroke-width="2.5"/><path d="M60 54 Q64 51 68 54" fill="none" stroke="#0a0d12" stroke-width="2.5"/>` + glint(43, 59) + glint(73, 59));
  // wrap the glasses so tools (and tests) can find them
  p[p.length - 1] = `<g id="sunglasses">${p[p.length - 1]}</g>`;
  // LED mouth
  if (mouth === 'bar') p.push(`<rect x="52" y="76" width="24" height="3.5" rx="1.75" fill="${acc}"/>`);
  if (mouth === 'dots') p.push([0, 1, 2, 3, 4].map(i => `<circle cx="${54 + i * 5}" cy="78" r="1.8" fill="${acc}"/>`).join(''));
  if (mouth === 'wave') p.push(`<path d="M52 78 q3 -3 6 0 t6 0 t6 0 t6 0" fill="none" stroke="${acc}" stroke-width="2" stroke-linecap="round"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}" role="img" aria-label="AI agent avatar (synthetic, wearing sunglasses)"><title>AI agent avatar — synthetic, not a photo</title>${p.join('')}</svg>`;
}

export function avatarResponse(seed, request) {
  const svg = agentAvatarSvg(seed);
  return new Response(request.method === 'HEAD' ? null : svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400',
    'content-security-policy': "default-src 'none'; style-src 'none'", 'x-content-type-options': 'nosniff' } });
}

// ---------- photos ----------
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_PENALTY = 15;     // points subtracted in search_matches when the counterpart has no photo
const u16 = (b, i) => (b[i] << 8) | b[i + 1];
const le24 = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const le32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

// JPEG: keep image data, drop APP1..APP15 (EXIF, XMP, GPS, maker notes, ICC) and comments.
function stripJpeg(b) {
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const out = [b.subarray(0, 2)]; let i = 2, w = 0, h = 0;
  while (i < b.length) {
    if (b[i] !== 0xFF) return null;
    const m = b[i + 1];
    if (m === 0xD9) { out.push(b.subarray(i, i + 2)); break; }
    if (m === 0xDA) { out.push(b.subarray(i)); break; }               // start of scan: rest is image data
    if (m >= 0xD0 && m <= 0xD7 || m === 0x01) { out.push(b.subarray(i, i + 2)); i += 2; continue; }
    const len = u16(b, i + 2); if (len < 2 || i + 2 + len > b.length) return null;
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) { h = u16(b, i + 5); w = u16(b, i + 7); }
    const drop = (m >= 0xE1 && m <= 0xEF) || m === 0xFE;
    if (!drop) out.push(b.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  if (!w || !h) return null;
  const total = out.reduce((n, x) => n + x.length, 0), res = new Uint8Array(total); let o = 0; for (const x of out) { res.set(x, o); o += x.length; }
  return { bytes: res, w, h };
}
// WebP: drop EXIF and XMP chunks (and clear their VP8X flags); refuse animations.
function stripWebp(b) {
  const tag = (i) => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
  if (b.length < 20 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null;
  const chunks = []; let i = 12, w = 0, h = 0;
  while (i + 8 <= b.length) {
    const t = tag(i), len = le32(b, i + 4), end = i + 8 + len + (len & 1);
    if (end > b.length + 1) return null;
    const data = b.subarray(i + 8, Math.min(i + 8 + len, b.length));
    if (t === 'ANIM' || t === 'ANMF') return null;
    if (t === 'VP8X') { w = le24(data, 4) + 1; h = le24(data, 7) + 1; }
    if (t === 'VP8 ' && !w) { w = (data[6] | (data[7] << 8)) & 0x3fff; h = (data[8] | (data[9] << 8)) & 0x3fff; }
    if (t === 'VP8L' && !w) { const bits = le32(data, 1); w = (bits & 0x3fff) + 1; h = ((bits >> 14) & 0x3fff) + 1; }
    if (t !== 'EXIF' && t !== 'XMP ') chunks.push(b.subarray(i, Math.min(end, b.length)));
    i = end;
  }
  if (!w || !h) return null;
  const total = 12 + chunks.reduce((n, x) => n + x.length, 0), res = new Uint8Array(total);
  res.set(b.subarray(0, 12)); let o = 12; for (const x of chunks) { res.set(x, o); o += x.length; }
  const sz = total - 8; res[4] = sz & 255; res[5] = (sz >> 8) & 255; res[6] = (sz >> 16) & 255; res[7] = (sz >>> 24) & 255;
  if (tag.call(null, 12) === 'VP8X') res[20] &= ~(0x08 | 0x04);    // EXIF + XMP flags off
  return { bytes: res, w, h };
}
export function cleanPhoto(buf, mime) {
  const b = new Uint8Array(buf);
  const r = mime === 'image/jpeg' ? stripJpeg(b) : mime === 'image/webp' ? stripWebp(b) : null;
  if (!r) return { error: 'File is not a valid JPEG or WebP image' };
  if (r.w < 128 || r.h < 128) return { error: 'Photo is too small (min 128×128 px)' };
  if (r.w > 4096 || r.h > 4096) return { error: 'Photo is too large (max 4096×4096 px)' };
  if (Math.abs(r.w - r.h) / Math.max(r.w, r.h) > 0.02) return { error: 'Photo must be square (the app crops it for you)' };
  return r;
}
export function photoUrl(h) { return h && h.photo_key ? `/media/photos/${h.photo_key}` : null; }
