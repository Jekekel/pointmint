// Digital twin avatars: human profile photo + sunglasses overlay (brand rule 2026-10-25).
// Twin picture = derived from the human's actual photo with shades. No photo → default
// placeholder that still wears sunglasses (never a blank circle). Synthetic /avatars/<id>.svg
// remains as a legacy cool robot face; agent avatar_url now points at /avatars/twin/<id>.svg.
//
// Composition is pure SVG with an embedded data-URI photo so it works as <img src> (external
// <image href> is blocked by browsers when SVG is used as an image). Cached in R2 under
// twins/<agentId>/<photo_key|none>.svg; regenerated when the human photo changes.

import { agentHue } from './identity.js';

const AGENT_ID_RE = /^[a-z0-9_]{1,48}$/;
const TWIN_CACHE_PREFIX = 'twins/';

function b64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  return btoa(s);
}

/** Fixed wayfarer sunglasses overlay sized for a 128×128 face crop (eyes ~ mid-upper). */
export function sunglassesOverlaySvg() {
  return `<g id="sunglasses" data-part="sunglasses" aria-hidden="true">
  <defs>
    <linearGradient id="twinLens" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1b2430"/><stop offset="0.55" stop-color="#05070b"/><stop offset="1" stop-color="#1a3350"/>
    </linearGradient>
  </defs>
  <path d="M30 52 L24 49 M98 52 L104 49" stroke="#0a0d12" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M32 46 H60 L58 62 Q57 67 52 67 H40 Q35 67 34 62 Z" fill="url(#twinLens)" stroke="#0a0d12" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M68 46 H96 L94 62 Q93 67 88 67 H76 Q71 67 70 62 Z" fill="url(#twinLens)" stroke="#0a0d12" stroke-width="2.6" stroke-linejoin="round"/>
  <rect x="59" y="48" width="10" height="3.5" rx="1.75" fill="#0a0d12"/>
  <path d="M38 58 l7 -5" stroke="#9ec9ff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
  <path d="M74 58 l7 -5" stroke="#9ec9ff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
</g>`;
}

/** Default twin placeholder when the human has no profile photo — cool silhouette + shades. */
export function twinPlaceholderSvg(seed = 'twin_default', { size = 128 } = {}) {
  const hue = agentHue('twin:' + seed);
  const acc = `hsl(${hue} 85% 64%)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}" role="img" aria-label="Digital twin avatar placeholder (wearing sunglasses)"><title>Digital twin — placeholder with sunglasses</title>
  <defs>
    <linearGradient id="tpBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 42% 22%)"/><stop offset="1" stop-color="hsl(${hue} 50% 8%)"/></linearGradient>
    <linearGradient id="tpSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 18% 62%)"/><stop offset="1" stop-color="hsl(${hue} 22% 38%)"/></linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#tpBg)"/>
  <path d="M18 128 C22 100 40 90 64 90 C88 90 106 100 110 128 Z" fill="hsl(${hue} 28% 20%)"/>
  <ellipse cx="64" cy="54" rx="30" ry="34" fill="url(#tpSkin)"/>
  <path d="M42 36 Q64 28 86 36" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.25" stroke-linecap="round"/>
  ${sunglassesOverlaySvg()}
  <rect x="54" y="78" width="20" height="3" rx="1.5" fill="${acc}" opacity="0.9"/>
</svg>`;
}

/** Compose human photo bytes + sunglasses into a self-contained SVG (safe as &lt;img src&gt;). */
export function twinFromPhotoSvg(photoBytes, mime, { size = 128 } = {}) {
  const ct = mime === 'image/jpeg' || mime === 'image/webp' ? mime : 'image/jpeg';
  const href = `data:${ct};base64,${b64(photoBytes)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" width="${size}" height="${size}" role="img" aria-label="Digital twin avatar (human photo with sunglasses)"><title>Digital twin — human photo with sunglasses</title>
  <defs>
    <clipPath id="twinFace"><rect x="0" y="0" width="128" height="128" rx="28"/></clipPath>
  </defs>
  <rect width="128" height="128" rx="28" fill="#0e1424"/>
  <image href="${href}" xlink:href="${href}" x="0" y="0" width="128" height="128" preserveAspectRatio="xMidYMid slice" clip-path="url(#twinFace)"/>
  ${sunglassesOverlaySvg()}
</svg>`;
}

/**
 * Public URL for an agent's twin avatar.
 * Always /avatars/twin/<agentId>.svg; ?v= busts caches when the human photo changes.
 */
export function twinAvatarUrl(agentId, humanOrPhoto = null) {
  const id = String(agentId || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 48);
  if (!id) return '/avatars/twin-placeholder.svg';
  const v = humanOrPhoto && (humanOrPhoto.photo_updated_at || humanOrPhoto.photo_key);
  const q = v ? `?v=${encodeURIComponent(String(v).replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 48))}` : '';
  return `/avatars/twin/${id}.svg${q}`;
}

export function twinAvatarNote(hasPhoto) {
  return hasPhoto
    ? 'Digital twin avatar: human profile photo with sunglasses overlay'
    : 'Digital twin placeholder (sunglasses); add a profile photo to derive the twin from your face';
}

function twinHeaders(etag, { immutable = false } = {}) {
  const cache = immutable
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=86400, stale-while-revalidate=604800';
  return {
    'content-type': 'image/svg+xml; charset=utf-8',
    'cache-control': cache,
    'content-security-policy': "default-src 'none'; style-src 'none'; img-src data:",
    'x-content-type-options': 'nosniff',
    'cross-origin-resource-policy': 'same-origin',
    ...(etag ? { etag } : {}),
  };
}

function svgResponse(svg, request, headers) {
  return new Response(request.method === 'HEAD' ? null : svg, { headers });
}

function cacheKey(agentId, photoKey) {
  const safe = (photoKey || 'none').replace(/[^a-zA-Z0-9._/-]/g, '_').slice(0, 120);
  return `${TWIN_CACHE_PREFIX}${agentId}/${safe}.svg`;
}

/** Drop cached twin objects for a human's agent (call on photo add/remove). */
export async function invalidateTwinCache(env, humanId) {
  if (!env.PHOTOS || !humanId) return;
  try {
    const a = await env.DB.prepare('SELECT id FROM agents WHERE human_id = ?').bind(humanId).first();
    if (!a) return;
    const prefix = `${TWIN_CACHE_PREFIX}${a.id}/`;
    const listed = await env.PHOTOS.list({ prefix, limit: 50 });
    for (const obj of listed.objects || []) await env.PHOTOS.delete(obj.key).catch(() => {});
  } catch { /* best-effort */ }
}

/**
 * Serve /avatars/twin/<agentId>.svg — compose from human photo + sunglasses, or placeholder.
 * Also handles /avatars/twin-placeholder.svg and /api/twin-avatar/<humanId>.
 */
export async function serveTwinAvatar(env, { agentId, humanId }, request) {
  let agent = null, human = null;
  if (agentId) {
    if (!AGENT_ID_RE.test(agentId)) return new Response('Not found', { status: 404 });
    // Host personas with no DB row still get a placeholder twin (sunglasses).
    agent = await env.DB.prepare('SELECT id, human_id FROM agents WHERE id = ?').bind(agentId).first();
    if (agent) human = await env.DB.prepare('SELECT id, photo_key, photo_mime, photo_updated_at FROM humans WHERE id = ? AND phone_verified_at IS NOT NULL').bind(agent.human_id).first();
    else {
      const svg = twinPlaceholderSvg(agentId);
      return svgResponse(svg, request, twinHeaders(`"ph-${agentId}"`));
    }
  } else if (humanId) {
    if (!/^h_[a-z0-9_]{1,40}$/.test(humanId) && !/^[a-z0-9_]{1,48}$/.test(humanId)) return new Response('Not found', { status: 404 });
    human = await env.DB.prepare('SELECT id, photo_key, photo_mime, photo_updated_at FROM humans WHERE id = ? AND phone_verified_at IS NOT NULL').bind(humanId).first();
    if (!human) return new Response('Not found', { status: 404 });
    agent = await env.DB.prepare('SELECT id, human_id FROM agents WHERE human_id = ?').bind(human.id).first();
    agentId = agent ? agent.id : ('twin_' + human.id.replace(/[^a-z0-9_]/gi, '').slice(0, 40));
  } else {
    const svg = twinPlaceholderSvg('twin_default');
    return svgResponse(svg, request, twinHeaders('"ph-default"', { immutable: true }));
  }

  const etagBase = human && human.photo_key
    ? `"t-${agentId}-${(human.photo_updated_at || human.photo_key).toString().slice(0, 40)}"`
    : `"t-${agentId}-none"`;
  const inm = request.headers.get('if-none-match');
  if (inm && inm === etagBase) return new Response(null, { status: 304, headers: twinHeaders(etagBase) });

  if (!human || !human.photo_key || !env.PHOTOS) {
    const svg = twinPlaceholderSvg(agentId);
    return svgResponse(svg, request, twinHeaders(etagBase));
  }

  const key = cacheKey(agentId, human.photo_key);
  const cached = await env.PHOTOS.get(key).catch(() => null);
  if (cached) {
    const body = request.method === 'HEAD' ? null : await cached.text();
    return new Response(body, { status: 200, headers: twinHeaders(etagBase, { immutable: true }) });
  }

  const obj = await env.PHOTOS.get(human.photo_key);
  if (!obj) {
    const svg = twinPlaceholderSvg(agentId);
    return svgResponse(svg, request, twinHeaders(etagBase));
  }
  const mime = obj.httpMetadata?.contentType || human.photo_mime || 'image/jpeg';
  if (!['image/jpeg', 'image/webp'].includes(mime)) {
    const svg = twinPlaceholderSvg(agentId);
    return svgResponse(svg, request, twinHeaders(etagBase));
  }
  const bytes = new Uint8Array(await obj.arrayBuffer());
  // Cap embed size so a huge photo cannot blow the Worker response (photos are already ≤5 MB / 512 client crop).
  if (bytes.length > 900_000) {
    const svg = twinPlaceholderSvg(agentId);
    return svgResponse(svg, request, twinHeaders(etagBase));
  }
  const svg = twinFromPhotoSvg(bytes, mime);
  if (env.ctx && env.PHOTOS) {
    env.ctx.waitUntil(env.PHOTOS.put(key, svg, {
      httpMetadata: { contentType: 'image/svg+xml; charset=utf-8', cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { agent_id: agentId, human_id: human.id, photo_key: human.photo_key, kind: 'twin_avatar' },
    }).catch(() => {}));
  } else if (env.PHOTOS) {
    await env.PHOTOS.put(key, svg, {
      httpMetadata: { contentType: 'image/svg+xml; charset=utf-8', cacheControl: 'public, max-age=31536000, immutable' },
      customMetadata: { agent_id: agentId, human_id: human.id, photo_key: human.photo_key, kind: 'twin_avatar' },
    }).catch(() => {});
  }
  return svgResponse(svg, request, twinHeaders(etagBase, { immutable: true }));
}
