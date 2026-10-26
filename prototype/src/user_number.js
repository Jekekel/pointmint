// §40 Sequential user_number — early-adopter status. Assigned once; never renumbered.
// Display: User 001 … User 999, then User 1000+ (pad to 3 only while n < 1000).

export function formatUserNumber(n) {
  if (n == null || n === '') return null;
  const num = Number(n);
  if (!Number.isFinite(num) || num < 1) return null;
  const i = Math.trunc(num);
  const body = i < 1000 ? String(i).padStart(3, '0') : String(i);
  return `User ${body}`;
}

export function normalizePersonName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[\t\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Assign the next (or reserved) user_number if missing. Idempotent; never changes an existing number. */
export async function ensureUserNumber(env, human) {
  if (!human || !human.id) return human;
  if (human.user_number != null && human.user_number !== '') return human;
  if (!human.phone_verified_at) return human;

  const nameNorm = normalizePersonName(human.name);

  // 1) Claim a founder reservation by normalized name (Isaac=002, Yosef=003, Michael=001 if somehow unclaimed).
  const res = await env.DB.prepare(
    'SELECT user_number FROM user_number_reservations WHERE name_norm = ? AND (claimed_human_id IS NULL OR claimed_human_id = \'\')'
  ).bind(nameNorm).first();

  if (res && res.user_number != null) {
    try {
      const taken = await env.DB.prepare('SELECT id FROM humans WHERE user_number = ?').bind(res.user_number).first();
      if (!taken) {
        await env.DB.prepare('UPDATE humans SET user_number = ? WHERE id = ? AND user_number IS NULL')
          .bind(res.user_number, human.id).run();
        await env.DB.prepare(
          'UPDATE user_number_reservations SET claimed_human_id = ? WHERE name_norm = ? AND (claimed_human_id IS NULL OR claimed_human_id = \'\')'
        ).bind(human.id, nameNorm).run();
      }
    } catch (_) { /* UNIQUE race — fall through */ }
    const after = await env.DB.prepare('SELECT * FROM humans WHERE id = ?').bind(human.id).first();
    if (after && after.user_number != null) return after;
  }

  // 2) Auto-assign from counter (skips numbers still reserved and unclaimed).
  for (let attempt = 0; attempt < 8; attempt++) {
    let ctr = await env.DB.prepare('SELECT next_number FROM user_number_counter WHERE id = 1').first();
    if (!ctr) {
      await env.DB.prepare('INSERT OR IGNORE INTO user_number_counter (id, next_number) VALUES (1, 4)').run();
      ctr = await env.DB.prepare('SELECT next_number FROM user_number_counter WHERE id = 1').first();
    }
    let n = ctr && ctr.next_number != null ? Number(ctr.next_number) : 4;
    if (!Number.isFinite(n) || n < 4) n = 4;

    // Bump past reserved-unclaimed and already-taken numbers.
    for (let guard = 0; guard < 50; guard++) {
      const reserved = await env.DB.prepare(
        'SELECT 1 AS ok FROM user_number_reservations WHERE user_number = ? AND (claimed_human_id IS NULL OR claimed_human_id = \'\')'
      ).bind(n).first();
      const occupied = await env.DB.prepare('SELECT 1 AS ok FROM humans WHERE user_number = ?').bind(n).first();
      if (!reserved && !occupied) break;
      n += 1;
    }

    try {
      const upd = await env.DB.prepare('UPDATE humans SET user_number = ? WHERE id = ? AND user_number IS NULL')
        .bind(n, human.id).run();
      if (upd.meta && upd.meta.changes === 0) {
        return await env.DB.prepare('SELECT * FROM humans WHERE id = ?').bind(human.id).first();
      }
      await env.DB.prepare('UPDATE user_number_counter SET next_number = ? WHERE id = 1').bind(n + 1).run();
      return await env.DB.prepare('SELECT * FROM humans WHERE id = ?').bind(human.id).first();
    } catch (e) {
      if (!String(e).includes('UNIQUE')) throw e;
    }
  }
  return await env.DB.prepare('SELECT * FROM humans WHERE id = ?').bind(human.id).first();
}
