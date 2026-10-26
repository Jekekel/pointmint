// Reciprocal Top 100 — each verified human's ordered list of up to 100 other L1+ verified humans.
// Reciprocity is server-computed: does contact_human_id also list human_id in their top 100?
import { HttpError, json, str, now, enforce, audit, currentHuman, readJson } from './worker.js';
import { photoUrl } from './identity.js';

export const TOP100_MAX = 100;
const HID = /^h_[a-z0-9]{3,40}$/;

function levelOf(h) {
  return h && h.verify_level === 'L3' ? 'L3' : h && h.phone_verified_at ? 'L1' : 'L0';
}

function pubEntry(r) {
  const contact = {
    id: r.contact_human_id,
    kind: 'human',
    name: r.name,
    headline: r.headline || '',
    company: r.company || '',
    is_demo: !!r.is_demo,
    level: levelOf(r),
    verified: !!r.phone_verified_at,
    has_photo: !!r.photo_key,
    photo_url: photoUrl({ photo_key: r.photo_key }),
  };
  const reciprocated = !!r.reciprocated;
  return {
    rank: r.rank | 0,
    contact,
    reciprocated,
    reciprocity_label: reciprocated ? 'Reciprocated' : 'Not reciprocated',
    mutual: reciprocated,
    their_rank_of_owner: reciprocated ? (r.their_rank | 0) : null,
  };
}

/** List owner's top 100 with per-row reciprocity (LEFT JOIN reverse edge). */
export async function listTop100(env, ownerHumanId) {
  const rows = (await env.DB.prepare(`
    SELECT t.rank, t.contact_human_id, t.created_at, t.updated_at,
      h.name, h.headline, h.company, h.is_demo, h.phone_verified_at, h.verify_level, h.photo_key,
      CASE WHEN rev.human_id IS NOT NULL THEN 1 ELSE 0 END AS reciprocated,
      rev.rank AS their_rank
    FROM top100_contacts t
    JOIN humans h ON h.id = t.contact_human_id AND h.phone_verified_at IS NOT NULL
    LEFT JOIN top100_contacts rev
      ON rev.human_id = t.contact_human_id AND rev.contact_human_id = t.human_id
    WHERE t.human_id = ?
    ORDER BY t.rank ASC
  `).bind(ownerHumanId).all()).results;
  const entries = rows.map(pubEntry);
  const reciprocated_n = entries.filter(e => e.reciprocated).length;
  return {
    human_id: ownerHumanId,
    name: 'Reciprocal Top 100',
    count: entries.length,
    max: TOP100_MAX,
    reciprocated_n,
    entries,
  };
}

async function requireVerifiedOwner(request, env) {
  const h = await currentHuman(request, env);
  if (!h) throw new HttpError(401, 'Sign in required');
  if (!h.phone_verified_at) throw new HttpError(403, 'Only verified humans (L1+) can maintain a Reciprocal Top 100');
  return h;
}

async function assertVerifiedContact(env, contactId, ownerId) {
  if (!HID.test(contactId)) throw new HttpError(400, 'contact_human_id must be a verified human id (not an agent or reserved profile)');
  if (contactId === ownerId) throw new HttpError(400, 'You cannot add yourself to your Reciprocal Top 100');
  const c = await env.DB.prepare('SELECT id, phone_verified_at, name FROM humans WHERE id = ?').bind(contactId).first();
  if (!c) throw new HttpError(404, 'Contact not found');
  if (!c.phone_verified_at) throw new HttpError(400, 'Only L1+ verified humans can be added (unverified rejected)');
  // Reject if this id is somehow also a reserved profile key (defensive; reserved use rp_ prefix).
  if (String(contactId).startsWith('rp_') || String(contactId).startsWith('agent_')) {
    throw new HttpError(400, 'Reserved profiles and agent ids cannot be listed');
  }
  return c;
}

async function nextRank(env, humanId) {
  const row = await env.DB.prepare('SELECT COALESCE(MAX(rank), 0) AS m FROM top100_contacts WHERE human_id = ?').bind(humanId).first();
  const n = (row && row.m | 0) + 1;
  if (n > TOP100_MAX) throw new HttpError(409, `Reciprocal Top 100 is full (${TOP100_MAX})`);
  return n;
}

async function countOwned(env, humanId) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM top100_contacts WHERE human_id = ?').bind(humanId).first();
  return row ? row.n | 0 : 0;
}

/** Add contact at optional rank (default: append). Owner only. */
export async function addTop100(env, owner, contactHumanId, rank, ip) {
  await assertVerifiedContact(env, contactHumanId, owner.id);
  const existing = await env.DB.prepare('SELECT rank FROM top100_contacts WHERE human_id = ? AND contact_human_id = ?')
    .bind(owner.id, contactHumanId).first();
  if (existing) throw new HttpError(409, 'Already on your Reciprocal Top 100');
  if ((await countOwned(env, owner.id)) >= TOP100_MAX) throw new HttpError(409, `Reciprocal Top 100 is full (${TOP100_MAX})`);

  let r = rank == null || rank === '' ? await nextRank(env, owner.id) : Number(rank);
  if (!Number.isInteger(r) || r < 1 || r > TOP100_MAX) throw new HttpError(400, 'rank must be an integer from 1 to 100');

  // If rank taken, shift everyone at/after it down (cap at 100).
  const clash = await env.DB.prepare('SELECT contact_human_id FROM top100_contacts WHERE human_id = ? AND rank = ?')
    .bind(owner.id, r).first();
  if (clash) {
    const toShift = (await env.DB.prepare(
      'SELECT contact_human_id, rank FROM top100_contacts WHERE human_id = ? AND rank >= ? ORDER BY rank DESC'
    ).bind(owner.id, r).all()).results;
    if ((await countOwned(env, owner.id)) + 1 > TOP100_MAX) throw new HttpError(409, `Reciprocal Top 100 is full (${TOP100_MAX})`);
    // Temporarily park at high ranks to avoid UNIQUE(human_id, rank) collisions, then place.
    for (const row of toShift) {
      await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
        .bind(row.rank + TOP100_MAX, now(), owner.id, row.contact_human_id).run();
    }
    for (const row of toShift) {
      const nr = row.rank + 1;
      if (nr > TOP100_MAX) {
        await env.DB.prepare('DELETE FROM top100_contacts WHERE human_id = ? AND contact_human_id = ?')
          .bind(owner.id, row.contact_human_id).run();
      } else {
        await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
          .bind(nr, now(), owner.id, row.contact_human_id).run();
      }
    }
  }

  try {
    await env.DB.prepare(
      'INSERT INTO top100_contacts (human_id, contact_human_id, rank, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(owner.id, contactHumanId, r, now(), now()).run();
  } catch (e) {
    throw new HttpError(409, 'Could not add contact (rank or pair conflict)');
  }
  await audit(env, { human_id: owner.id, actor_type: 'human', action: 'top100.added', detail: { contact_human_id: contactHumanId, rank: r }, ip });
  return listTop100(env, owner.id);
}

/** Remove one contact; compact ranks 1..n. Owner only. */
export async function removeTop100(env, owner, contactHumanId, ip) {
  if (!HID.test(contactHumanId)) throw new HttpError(400, 'Invalid contact_human_id');
  const row = await env.DB.prepare('SELECT rank FROM top100_contacts WHERE human_id = ? AND contact_human_id = ?')
    .bind(owner.id, contactHumanId).first();
  if (!row) throw new HttpError(404, 'Not on your Reciprocal Top 100');
  await env.DB.prepare('DELETE FROM top100_contacts WHERE human_id = ? AND contact_human_id = ?')
    .bind(owner.id, contactHumanId).run();
  // Compact: move ranks above the hole down by 1 (via temp offset to avoid UNIQUE clashes).
  const above = (await env.DB.prepare(
    'SELECT contact_human_id, rank FROM top100_contacts WHERE human_id = ? AND rank > ? ORDER BY rank ASC'
  ).bind(owner.id, row.rank).all()).results;
  for (const x of above) {
    await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
      .bind(x.rank + TOP100_MAX, now(), owner.id, x.contact_human_id).run();
  }
  for (const x of above) {
    await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
      .bind(x.rank - 1, now(), owner.id, x.contact_human_id).run();
  }
  await audit(env, { human_id: owner.id, actor_type: 'human', action: 'top100.removed', detail: { contact_human_id: contactHumanId }, ip });
  return listTop100(env, owner.id);
}

/** Reorder: ordered_ids is the full desired order of contact_human_ids. Owner only. */
export async function reorderTop100(env, owner, orderedIds, ip) {
  if (!Array.isArray(orderedIds)) throw new HttpError(400, 'ordered_ids must be an array');
  if (orderedIds.length > TOP100_MAX) throw new HttpError(400, `at most ${TOP100_MAX} contacts`);
  const uniq = new Set();
  for (const id of orderedIds) {
    if (!HID.test(id)) throw new HttpError(400, 'Invalid contact id in ordered_ids');
    if (uniq.has(id)) throw new HttpError(400, 'Duplicate contact in ordered_ids');
    uniq.add(id);
  }
  const current = (await env.DB.prepare('SELECT contact_human_id FROM top100_contacts WHERE human_id = ?')
    .bind(owner.id).all()).results.map(r => r.contact_human_id);
  if (current.length !== orderedIds.length || current.some(id => !uniq.has(id))) {
    throw new HttpError(400, 'ordered_ids must include exactly your current contacts');
  }
  // Park all ranks, then assign 1..n
  for (let i = 0; i < orderedIds.length; i++) {
    await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
      .bind(i + 1 + TOP100_MAX, now(), owner.id, orderedIds[i]).run();
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await env.DB.prepare('UPDATE top100_contacts SET rank = ?, updated_at = ? WHERE human_id = ? AND contact_human_id = ?')
      .bind(i + 1, now(), owner.id, orderedIds[i]).run();
  }
  await audit(env, { human_id: owner.id, actor_type: 'human', action: 'top100.reordered', detail: { count: orderedIds.length }, ip });
  return listTop100(env, owner.id);
}

export async function handleTop100Api(request, env, url, ip) {
  const p = url.pathname, method = request.method;
  if (!p.startsWith('/api/top100')) return null;
  await enforce(env, 'top100:ip:' + ip, 180, 60);

  // GET /api/top100/me — owner
  if (p === '/api/top100/me' && method === 'GET') {
    const h = await requireVerifiedOwner(request, env);
    return json(await listTop100(env, h.id), 200, { vary: 'Cookie' });
  }

  // GET /api/top100/:humanId — signed-in members only
  let m;
  if ((m = p.match(/^\/api\/top100\/(h_[a-z0-9]{3,40})$/)) && method === 'GET') {
    const viewer = await currentHuman(request, env);
    if (!viewer || !viewer.phone_verified_at) throw new HttpError(401, 'Sign in as a verified member to view Reciprocal Top 100');
    const owner = await env.DB.prepare('SELECT id, name, phone_verified_at FROM humans WHERE id = ? AND phone_verified_at IS NOT NULL').bind(m[1]).first();
    if (!owner) throw new HttpError(404, 'Member not found');
    const list = await listTop100(env, owner.id);
    return json({ ...list, owner: { id: owner.id, name: owner.name, kind: 'human' }, is_own: viewer.id === owner.id }, 200, { vary: 'Cookie' });
  }

  // POST /api/top100 — add { contact_human_id, rank? }
  if (p === '/api/top100' && method === 'POST') {
    const h = await requireVerifiedOwner(request, env);
    await enforce(env, 'top100:write:' + h.id, 60, 60);
    const b = await readJson(request);
    const contact = str(b.contact_human_id, 'contact_human_id', { required: true, min: 3, max: 48 });
    const list = await addTop100(env, h, contact, b.rank, ip);
    return json({ ok: true, ...list }, 201);
  }

  // DELETE /api/top100/:contactHumanId
  if ((m = p.match(/^\/api\/top100\/(h_[a-z0-9]{3,40})$/)) && method === 'DELETE') {
    const h = await requireVerifiedOwner(request, env);
    await enforce(env, 'top100:write:' + h.id, 60, 60);
    const list = await removeTop100(env, h, m[1], ip);
    return json({ ok: true, ...list });
  }

  // PUT /api/top100/reorder — { ordered_ids: [...] }
  if (p === '/api/top100/reorder' && method === 'PUT') {
    const h = await requireVerifiedOwner(request, env);
    await enforce(env, 'top100:write:' + h.id, 60, 60);
    const b = await readJson(request);
    const list = await reorderTop100(env, h, b.ordered_ids, ip);
    return json({ ok: true, ...list });
  }

  throw new HttpError(404, 'Not found');
}

/** Compact shape for /api/page human subject (signed-in viewers only; guests get null). */
export async function top100ForPage(env, ownerHumanId, viewerHumanId) {
  if (!viewerHumanId) return null;
  const list = await listTop100(env, ownerHumanId);
  return {
    name: 'Reciprocal Top 100',
    count: list.count,
    max: list.max,
    reciprocated_n: list.reciprocated_n,
    is_own: viewerHumanId === ownerHumanId,
    entries: list.entries,
  };
}
