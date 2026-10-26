// Match Point scoreboard — phase 0 aggregate (SPEC §43).
// Four types only: human, bot, buy, sell. Network-wide totals, not a per-member score
// and not the final ledger. Private vault cards never count. Seek and acquire stay off
// this board until a closed intro awards the buy side (phase 1).
import { json, enforce, now } from './worker.js';

export const POINTS_PHASE = 'aggregate';

// One point per row. A post or thread written together (author "both") scores once
// on Human and once on Bot. Buy/Sell = non-private cards of that type, plus one
// extra point for each accepted intro that cites such a card.
export const POINTS_SQL = `SELECT
  (SELECT COUNT(*) FROM posts WHERE status = 'published' AND author_type IN ('human', 'both'))
  + (SELECT COUNT(*) FROM intros WHERE proposed_by = 'human')
  + (SELECT COUNT(*) FROM messages WHERE sender_type = 'human')
  + (SELECT COUNT(*) FROM threads WHERE status = 'published' AND author_type IN ('human', 'both'))
  AS human,
  (SELECT COUNT(*) FROM posts WHERE status = 'published' AND author_type IN ('agent', 'both'))
  + (SELECT COUNT(*) FROM intros WHERE proposed_by = 'agent')
  + (SELECT COUNT(*) FROM messages WHERE sender_type = 'agent')
  + (SELECT COUNT(*) FROM threads WHERE status = 'published' AND author_type IN ('agent', 'both'))
  AS bot,
  (SELECT COUNT(*) FROM vault_items WHERE type = 'buy' AND visibility <> 'private')
  + (SELECT COUNT(*) FROM intros i JOIN vault_items v ON v.id = i.from_item_id OR v.id = i.to_item_id
      WHERE i.status = 'accepted' AND v.type = 'buy' AND v.visibility <> 'private')
  AS buy,
  (SELECT COUNT(*) FROM vault_items WHERE type = 'sell' AND visibility <> 'private')
  + (SELECT COUNT(*) FROM intros i JOIN vault_items v ON v.id = i.from_item_id OR v.id = i.to_item_id
      WHERE i.status = 'accepted' AND v.type = 'sell' AND v.visibility <> 'private')
  AS sell`;

const n = v => Math.max(0, Math.trunc(Number(v) || 0));

export async function matchPoints(env) {
  const row = await env.DB.prepare(POINTS_SQL).first();
  return {
    human: n(row && row.human),
    bot: n(row && row.bot),
    buy: n(row && row.buy),
    sell: n(row && row.sell),
    phase: POINTS_PHASE,
    includes_demo: true,
    as_of: now(),
  };
}

export async function handlePointsApi(request, env, url, ip) {
  const p = url.pathname, method = request.method;
  if (p !== '/api/points' || (method !== 'GET' && method !== 'HEAD')) return null;
  await enforce(env, 'points:ip:' + ip, 120, 60);
  return json(await matchPoints(env));
}
