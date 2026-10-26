// Global handles for humans and company entities — one namespace, human-only mutations (§28).
import { HttpError, json, str, now, enforce, audit, currentHuman, readJson, pubHuman } from './worker.js';

async function requireHuman(request, env) {
  const h = await currentHuman(request, env);
  if (!h) throw new HttpError(401, 'Sign in required');
  return h;
}

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 32;
export const HANDLE_RE = /^[a-z0-9]([a-z0-9_-]{1,30}[a-z0-9])?$/; // 3–32, start/end alnum

/** SPA first-path segments + system words — blocked as handles. Kept in sync with client RESERVED_HANDLES. */
export const RESERVED_HANDLES = new Set([
  'h', 'a', 'p', 'api', 'admin', 'mcp', 'oauth', 'network', 'vault', 'matches', 'activity', 'intros',
  'signup', 'dashboard', 'about', 'docs', 'connect', 'import', 'community', 'launch', 'graph', 'index',
  'assets', 'avatars', 'media', 'glass', 'llms', 'login', 'logout', 'settings', 'me', 'null', 'undefined',
  'home', 'robots', 'sitemap', 'favicon', 'static', 'public', 'private', 'ws', 'sse', 'health', 'status',
  'term', 'feed', 'col', 'hud', 'theme', 'styles', 'split', 'float', 'top100', 'deck', 'identity',
  'company', 'companies', 'human', 'humans', 'agent', 'agents', 'entity', 'entities', 'reserved',
  'claim', 'claims', 'handle', 'handles', 'profile', 'profiles', 'user', 'users', 'org', 'orgs',
  'www', 'app', 'cdn', 'static', 'well-known', 'favicon', 'og', 'opengraph',
]);

export function normalizeHandle(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

/** Validate + normalize. Returns lowercase handle or throws HttpError(400). Empty string clears. */
export function parseHandle(raw, { allowEmpty = false } = {}) {
  if (raw === null || raw === undefined) throw new HttpError(400, 'handle is required');
  const h = normalizeHandle(raw);
  if (h === '') {
    if (allowEmpty) return '';
    throw new HttpError(400, 'handle is required');
  }
  if (h.length < HANDLE_MIN || h.length > HANDLE_MAX) {
    throw new HttpError(400, `Handle must be ${HANDLE_MIN}–${HANDLE_MAX} characters`);
  }
  if (!HANDLE_RE.test(h)) {
    throw new HttpError(400, 'Handle must be lowercase letters, numbers, hyphens or underscores; start and end with alphanumeric');
  }
  if (RESERVED_HANDLES.has(h)) {
    throw new HttpError(400, 'That handle is reserved');
  }
  return h;
}

export function isReservedHandle(h) {
  return RESERVED_HANDLES.has(normalizeHandle(h));
}

/** Resolve a handle from the global registry. Returns { handle, kind, owner_id } or null. */
export async function resolveHandle(env, raw) {
  const h = normalizeHandle(raw);
  if (!h || h.length < HANDLE_MIN || h.length > HANDLE_MAX || !HANDLE_RE.test(h) || RESERVED_HANDLES.has(h)) return null;
  return env.DB.prepare('SELECT handle, kind, owner_id FROM handles WHERE handle = ?').bind(h).first();
}

export function profilePath(owner) {
  // Prefer /{handle} when set; else /h/{id} for humans; companies without handle keep /connect?to=
  if (owner && owner.handle) return '/' + owner.handle;
  if (owner && owner.kind === 'company') return '/connect?to=' + encodeURIComponent(owner.id);
  if (owner && owner.id) return '/h/' + owner.id;
  return null;
}

async function assertCompanyOwnership(env, humanId, entityId) {
  const ent = await env.DB.prepare("SELECT id, type, name, handle FROM entities WHERE id = ? AND type = 'company'").bind(entityId).first();
  if (!ent) throw new HttpError(404, 'Company not found');
  // Proven claim rails (prototype): founded / co_founded / led graph edge from this verified human.
  const edge = await env.DB.prepare(
    `SELECT id FROM graph_edges WHERE src = ? AND dst = ? AND rel IN ('founded','co_founded','led') LIMIT 1`
  ).bind(humanId, entityId).first();
  if (!edge) {
    throw new HttpError(403, 'Only a verified human with proven claim on this company (founded / co-founded / led) can set its handle (§28)');
  }
  return ent;
}

/** Bind or clear a handle for a human or company. Global uniqueness via handles table. */
export async function setHandle(env, { kind, ownerId, handle, humanId, ip }) {
  const cleared = handle === '';
  if (!cleared) {
    const taken = await env.DB.prepare('SELECT handle, kind, owner_id FROM handles WHERE handle = ?').bind(handle).first();
    if (taken && !(taken.kind === kind && taken.owner_id === ownerId)) {
      throw new HttpError(409, 'Handle is already taken', { handle });
    }
  }
  const prev = await env.DB.prepare('SELECT handle FROM handles WHERE kind = ? AND owner_id = ?').bind(kind, ownerId).first();
  const t = now();
  // Apply registry + denormalized column in sequence (D1 has no multi-statement tx across prepares easily;
  // UNIQUE on handles is the hard gate).
  if (prev && prev.handle) {
    await env.DB.prepare('DELETE FROM handles WHERE kind = ? AND owner_id = ?').bind(kind, ownerId).run();
  }
  if (kind === 'human') {
    await env.DB.prepare('UPDATE humans SET handle = ? WHERE id = ?').bind(cleared ? null : handle, ownerId).run();
  } else {
    await env.DB.prepare('UPDATE entities SET handle = ? WHERE id = ?').bind(cleared ? null : handle, ownerId).run();
  }
  if (!cleared) {
    try {
      await env.DB.prepare(
        'INSERT INTO handles (handle, kind, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(handle, kind, ownerId, t, t).run();
    } catch (e) {
      // roll denormalized back on collision
      if (kind === 'human') await env.DB.prepare('UPDATE humans SET handle = ? WHERE id = ?').bind(prev ? prev.handle : null, ownerId).run();
      else await env.DB.prepare('UPDATE entities SET handle = ? WHERE id = ?').bind(prev ? prev.handle : null, ownerId).run();
      if (prev && prev.handle) {
        await env.DB.prepare('INSERT OR IGNORE INTO handles (handle, kind, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
          .bind(prev.handle, kind, ownerId, t, t).run();
      }
      if (String(e).includes('UNIQUE') || String(e.message || '').includes('UNIQUE')) {
        throw new HttpError(409, 'Handle is already taken', { handle });
      }
      throw e;
    }
  }
  await audit(env, {
    human_id: humanId, actor_type: 'human',
    action: cleared ? 'handle.cleared' : 'handle.set',
    detail: { kind, owner_id: ownerId, handle: cleared ? null : handle, previous: prev ? prev.handle : null },
    ip,
  });
  return { handle: cleared ? null : handle, kind, owner_id: ownerId, href: cleared ? null : '/' + handle };
}

export async function handleHandlesApi(request, env, url, ip) {
  const p = url.pathname, method = request.method;
  let m;

  // GET /api/handles/:handle — public resolve
  if ((m = p.match(/^\/api\/handles\/([a-z0-9][a-z0-9_-]{1,31})$/)) && method === 'GET') {
    await enforce(env, 'handle:get:' + ip, 120, 60, 'Handle lookup rate limit');
    const row = await resolveHandle(env, m[1]);
    if (!row) throw new HttpError(404, 'Handle not found');
    if (row.kind === 'human') {
      const h = await env.DB.prepare('SELECT * FROM humans WHERE id = ? AND phone_verified_at IS NOT NULL').bind(row.owner_id).first();
      if (!h) throw new HttpError(404, 'Handle not found');
      return json({ handle: row.handle, kind: 'human', owner_id: h.id, href: '/' + row.handle, human: pubHuman(h) });
    }
    const e = await env.DB.prepare("SELECT * FROM entities WHERE id = ? AND type = 'company'").bind(row.owner_id).first();
    if (!e) throw new HttpError(404, 'Handle not found');
    return json({
      handle: row.handle, kind: 'company', owner_id: e.id, href: '/' + row.handle,
      company: { id: e.id, type: e.type, name: e.name, handle: e.handle || row.handle, source_url: e.source_url || null, is_demo: !!e.is_demo },
    });
  }

  // PATCH /api/me/handle — own human handle (verified human session only)
  if (p === '/api/me/handle' && method === 'PATCH') {
    const h = await requireHuman(request, env);
    if (!h.phone_verified_at) throw new HttpError(403, 'Only verified humans can set a handle');
    // Agent bearer must not mutate handles (§28) — requireHuman is session cookie only, but double-check.
    await enforce(env, 'handle:set:' + h.id, 10, 3600, 'Handle change limit: 10 per hour');
    const b = await readJson(request);
    const next = parseHandle(b.handle, { allowEmpty: true });
    const out = await setHandle(env, { kind: 'human', ownerId: h.id, handle: next, humanId: h.id, ip });
    return json({ ok: true, ...out });
  }

  // PATCH /api/companies/:entityId/handle — company handle; verified human with founded/co_founded/led only
  if ((m = p.match(/^\/api\/companies\/(company:[a-z0-9][a-z0-9_-]{1,60})\/handle$/)) && method === 'PATCH') {
    const human = await requireHuman(request, env);
    if (!human.phone_verified_at) throw new HttpError(403, 'Only verified humans can set a company handle');
    await enforce(env, 'handle:co:' + human.id, 10, 3600, 'Company handle change limit: 10 per hour');
    const ent = await assertCompanyOwnership(env, human.id, m[1]);
    const b = await readJson(request);
    const next = parseHandle(b.handle, { allowEmpty: true });
    const out = await setHandle(env, { kind: 'company', ownerId: ent.id, handle: next, humanId: human.id, ip });
    return json({ ok: true, company_id: ent.id, company_name: ent.name, ...out });
  }

  // GET /api/me/companies — companies this human can manage handles for
  if (p === '/api/me/companies' && method === 'GET') {
    const h = await currentHuman(request, env);
    if (!h) return json({ signed_in: false, companies: [] });
    const rows = (await env.DB.prepare(`
      SELECT e.id, e.name, e.handle, e.is_demo, e.source_url, g.rel
      FROM graph_edges g JOIN entities e ON e.id = g.dst AND e.type = 'company'
      WHERE g.src = ? AND g.rel IN ('founded','co_founded','led')
      ORDER BY e.name LIMIT 50
    `).bind(h.id).all()).results;
    return json({
      signed_in: true,
      companies: rows.map(r => ({
        id: r.id, name: r.name, handle: r.handle || null, is_demo: !!r.is_demo,
        claim_rel: r.rel, href: r.handle ? '/' + r.handle : '/connect?to=' + encodeURIComponent(r.id),
      })),
    });
  }

  return null;
}

/** Company page payload for /{handle} when kind=company. */
export async function companyPageData(env, entityId) {
  const e = await env.DB.prepare("SELECT * FROM entities WHERE id = ? AND type = 'company'").bind(entityId).first();
  if (!e) return null;
  const people = (await env.DB.prepare(`
    SELECT g.rel, g.label, g.provenance, h.id AS human_id, h.name, h.handle, h.headline, h.is_demo, h.photo_key, h.phone_verified_at
    FROM graph_edges g LEFT JOIN humans h ON h.id = g.src
    WHERE g.dst = ? AND g.rel IN ('founded','co_founded','led','worked_at')
    ORDER BY CASE g.rel WHEN 'founded' THEN 0 WHEN 'co_founded' THEN 1 WHEN 'led' THEN 2 ELSE 3 END, h.name
    LIMIT 40
  `).bind(entityId).all()).results;
  return {
    company: {
      id: e.id, type: 'company', kind: 'company', name: e.name,
      handle: e.handle || null, href: e.handle ? '/' + e.handle : '/connect?to=' + encodeURIComponent(e.id),
      source_url: e.source_url || null, is_demo: !!e.is_demo,
    },
    people: people.filter(p => p.human_id && p.phone_verified_at).map(p => ({
      id: p.human_id, name: p.name, handle: p.handle || null,
      href: p.handle ? '/' + p.handle : '/h/' + p.human_id,
      headline: p.headline || '', rel: p.rel, label: p.label, is_demo: !!p.is_demo,
    })),
  };
}
