// Top 10 leaderboard (SPEC §42).
// Points use the same 2×2 matrix as the HUD scoreboard (SPEC §43):
// rows Human / Bot, columns Buy / Sell. GET /api/points is served by points.js.
// This module is the per-pair ranking. Network totals come from matchPoints so
// the two surfaces cannot drift.
// Private vault cards never score. Seek and acquire stay off the board.
// Private bot window and PM guide threads are different tables and are not counted.
import { json, enforce, currentHuman } from './worker.js';
import { photoUrl } from './identity.js';
import { twinAvatarUrl } from './twin_avatar.js';
import {
  POINTS_PHASE,
  matchPoints,
  emptyCells,
  addCell,
  addDominant,
  cellTotal,
  sameCells,
  dominantSideSql,
  PROPOSAL_SIDE_SQL,
  INTRO_MESSAGE_SIDE_SQL,
} from './points.js';

export { POINTS_PHASE };

const PAIR_SQL = `SELECT
  h.id AS human_id,
  h.name AS name,
  h.handle AS handle,
  h.headline AS headline,
  h.is_demo AS is_demo,
  h.photo_key AS photo_key,
  h.photo_updated_at AS photo_updated_at,
  h.phone_verified_at AS phone_verified_at,
  h.created_at AS created_at,
  a.id AS agent_id,
  a.name AS agent_name,
  a.provider AS agent_provider,
  (SELECT COUNT(*) FROM posts p WHERE p.human_id = h.id AND p.status = 'published' AND p.author_type IN ('human','both')) AS posts_human,
  (SELECT COUNT(*) FROM posts p WHERE p.human_id = h.id AND p.status = 'published' AND p.author_type IN ('agent','both')) AS posts_bot,
  (SELECT COUNT(*) FROM intros i WHERE i.from_human_id = h.id AND i.proposed_by = 'human') AS intros_proposed_human,
  (SELECT COUNT(*) FROM intros i WHERE i.from_human_id = h.id AND i.proposed_by = 'agent') AS intros_proposed_bot,
  (SELECT COUNT(*) FROM messages m WHERE m.sender_human_id = h.id AND m.sender_type = 'human' AND m.intro_id IS NOT NULL) AS match_messages_human,
  (SELECT COUNT(*) FROM messages m WHERE m.sender_human_id = h.id AND m.sender_type = 'agent' AND m.intro_id IS NOT NULL) AS match_messages_bot,
  (SELECT COUNT(*) FROM messages m WHERE m.sender_human_id = h.id AND m.sender_type = 'human' AND m.intro_id IS NULL) AS direct_messages_human,
  (SELECT COUNT(*) FROM messages m WHERE m.sender_human_id = h.id AND m.sender_type = 'agent' AND m.intro_id IS NULL) AS direct_messages_bot,
  (SELECT COUNT(*) FROM threads t WHERE t.human_id = h.id AND t.status = 'published' AND t.author_type IN ('human','both')) AS community_human,
  (SELECT COUNT(*) FROM threads t WHERE t.human_id = h.id AND t.status = 'published' AND t.author_type IN ('agent','both')) AS community_bot,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'buy' AND v.visibility <> 'private') AS vault_buy,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'sell' AND v.visibility <> 'private') AS vault_sell,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'buy' AND v.visibility <> 'private' AND v.created_by = 'human') AS vault_buy_human,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'buy' AND v.visibility <> 'private' AND v.created_by = 'agent') AS vault_buy_bot,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'sell' AND v.visibility <> 'private' AND v.created_by = 'human') AS vault_sell_human,
  (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = h.id AND v.type = 'sell' AND v.visibility <> 'private' AND v.created_by = 'agent') AS vault_sell_bot
FROM humans h
LEFT JOIN agents a ON a.human_id = h.id`;

const ACCEPTED_SQL = `SELECT v.human_id AS human_id, v.type AS type, v.created_by AS created_by, COUNT(*) AS n
FROM intros i
JOIN vault_items v ON v.id = i.from_item_id OR v.id = i.to_item_id
WHERE i.status = 'accepted' AND v.type IN ('buy','sell') AND v.visibility <> 'private'
GROUP BY v.human_id, v.type, v.created_by`;

function proposalSql() {
  return `SELECT i.from_human_id AS human_id, i.proposed_by AS actor, ${PROPOSAL_SIDE_SQL} AS side, COUNT(*) AS n
FROM intros i
LEFT JOIN vault_items fv ON fv.id = i.from_item_id
LEFT JOIN vault_items tv ON tv.id = i.to_item_id
GROUP BY 1, 2, 3`;
}

function introMsgSql() {
  return `SELECT m.sender_human_id AS human_id, m.sender_type AS actor, ${INTRO_MESSAGE_SIDE_SQL} AS side, COUNT(*) AS n
FROM messages m
JOIN intros i ON i.id = m.intro_id
LEFT JOIN vault_items fv ON fv.id = i.from_item_id
LEFT JOIN vault_items tv ON tv.id = i.to_item_id
GROUP BY 1, 2, 3`;
}

// Recent form only. Lifetime totals stay on the row; this is the 7-day sparkline.
// Separate statements: D1 rejects a compound SELECT with this many UNION arms
// ("too many terms in compound SELECT").
function sparkQueries() {
  return [
  `SELECT p.human_id AS human_id, substr(COALESCE(p.published_at, p.created_at), 1, 10) AS day,
      (CASE WHEN p.author_type IN ('human','both') AND ${dominantSideSql('p.human_id', 'human')} IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN p.author_type IN ('agent','both') AND ${dominantSideSql('p.human_id', 'agent')} IS NOT NULL THEN 1 ELSE 0 END) AS pts
    FROM posts p WHERE p.status = 'published' AND substr(COALESCE(p.published_at, p.created_at), 1, 10) >= ?`,
  `SELECT i.from_human_id AS human_id, substr(i.created_at, 1, 10) AS day,
      CASE WHEN (${PROPOSAL_SIDE_SQL}) IS NOT NULL THEN 1 ELSE 0 END AS pts
    FROM intros i
    LEFT JOIN vault_items fv ON fv.id = i.from_item_id
    LEFT JOIN vault_items tv ON tv.id = i.to_item_id
    WHERE substr(i.created_at, 1, 10) >= ?`,
  `SELECT m.sender_human_id AS human_id, substr(m.created_at, 1, 10) AS day,
      CASE
        WHEN m.intro_id IS NOT NULL AND (${INTRO_MESSAGE_SIDE_SQL}) IS NOT NULL THEN 1
        WHEN m.intro_id IS NULL AND CASE WHEN m.sender_type = 'agent' THEN ${dominantSideSql('m.sender_human_id', 'agent')} ELSE ${dominantSideSql('m.sender_human_id', 'human')} END IS NOT NULL THEN 1
        ELSE 0
      END AS pts
    FROM messages m
    LEFT JOIN intros i ON i.id = m.intro_id
    LEFT JOIN vault_items fv ON fv.id = i.from_item_id
    LEFT JOIN vault_items tv ON tv.id = i.to_item_id
    WHERE substr(m.created_at, 1, 10) >= ?`,
  `SELECT t.human_id AS human_id, substr(COALESCE(t.published_at, t.created_at), 1, 10) AS day,
      (CASE WHEN t.author_type IN ('human','both') AND ${dominantSideSql('t.human_id', 'human')} IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN t.author_type IN ('agent','both') AND ${dominantSideSql('t.human_id', 'agent')} IS NOT NULL THEN 1 ELSE 0 END) AS pts
    FROM threads t WHERE t.status = 'published' AND substr(COALESCE(t.published_at, t.created_at), 1, 10) >= ?`,
  `SELECT human_id AS human_id, substr(created_at, 1, 10) AS day, 1 AS pts
    FROM vault_items WHERE type IN ('buy','sell') AND visibility <> 'private' AND substr(created_at, 1, 10) >= ?`,
  `SELECT v.human_id AS human_id, substr(COALESCE(i.recipient_decided_at, i.created_at), 1, 10) AS day, 1 AS pts
    FROM intros i
    JOIN vault_items v ON v.id = i.from_item_id OR v.id = i.to_item_id
    WHERE i.status = 'accepted' AND v.type IN ('buy','sell') AND v.visibility <> 'private'
      AND substr(COALESCE(i.recipient_decided_at, i.created_at), 1, 10) >= ?`,
  ];
}

export const ACTIVITY_DEFS = [
  { key: 'posts', label: 'Posts', hint: 'Published posts. Written together scores 1 Human and 1 Bot.' },
  { key: 'intros_accepted', label: 'Intros accepted', hint: 'One point per non-private buy or sell card an accepted intro cites.' },
  { key: 'intros_proposed', label: 'Intros proposed', hint: 'Intro proposals from the human or their agent. Human or Bot, even before acceptance.' },
  { key: 'vault_buy', label: 'Vault buy', hint: 'Buy cards that are not private. Seek and acquire do not score.' },
  { key: 'vault_sell', label: 'Vault sell', hint: 'Sell cards that are not private.' },
  { key: 'matches', label: 'Matches', hint: 'Messages inside an intro thread. Human or Bot.' },
  { key: 'community', label: 'Community', hint: 'Published community threads. Written together scores 1 Human and 1 Bot.' },
  { key: 'direct_messages', label: 'Direct messages', hint: 'Messages outside an intro thread. Private bot window and PM guide threads are not included.' },
];

const n = v => Math.max(0, Math.trunc(Number(v) || 0));

function showFounder(env) {
  return String(env && env.SHOW_FOUNDER || 'false').toLowerCase() === 'true';
}

function ownerIds(env) {
  return new Set(String(env && env.PLATFORM_OWNER_HUMAN_IDS || '')
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => /^h_[a-z0-9]+$/i.test(s)));
}

function utcDay(offset) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function blankSides() {
  return emptyCells();
}

function foldSides(map, humanId, actor, side, pts) {
  if (side !== 'buy' && side !== 'sell') return;
  if (!map.has(humanId)) map.set(humanId, blankSides());
  addCell(map.get(humanId), actor, side, pts);
}

function scorePair(row, accepted, proposals, introMsgs) {
  const postsHuman = n(row.posts_human);
  const postsBot = n(row.posts_bot);
  const proposedHuman = n(row.intros_proposed_human);
  const proposedBot = n(row.intros_proposed_bot);
  const matchHuman = n(row.match_messages_human);
  const matchBot = n(row.match_messages_bot);
  const directHuman = n(row.direct_messages_human);
  const directBot = n(row.direct_messages_bot);
  const communityHuman = n(row.community_human);
  const communityBot = n(row.community_bot);
  const vaultBuy = n(row.vault_buy);
  const vaultSell = n(row.vault_sell);
  const acc = accepted.get(row.human_id) || blankSides();
  const cells = blankSides();
  addCell(cells, 'human', 'buy', row.vault_buy_human);
  addCell(cells, 'bot', 'buy', row.vault_buy_bot);
  addCell(cells, 'human', 'sell', row.vault_sell_human);
  addCell(cells, 'bot', 'sell', row.vault_sell_bot);
  addCell(cells, 'human', 'buy', acc.human.buy);
  addCell(cells, 'human', 'sell', acc.human.sell);
  addCell(cells, 'bot', 'buy', acc.bot.buy);
  addCell(cells, 'bot', 'sell', acc.bot.sell);
  const prop = proposals.get(row.human_id);
  const intro = introMsgs.get(row.human_id);
  if (prop) {
    addCell(cells, 'human', 'buy', prop.human.buy);
    addCell(cells, 'human', 'sell', prop.human.sell);
    addCell(cells, 'bot', 'buy', prop.bot.buy);
    addCell(cells, 'bot', 'sell', prop.bot.sell);
  }
  if (intro) {
    addCell(cells, 'human', 'buy', intro.human.buy);
    addCell(cells, 'human', 'sell', intro.human.sell);
    addCell(cells, 'bot', 'buy', intro.bot.buy);
    addCell(cells, 'bot', 'sell', intro.bot.sell);
  }
  addDominant(cells, 'human', row.vault_buy_human, row.vault_sell_human, postsHuman + communityHuman + directHuman);
  addDominant(cells, 'bot', row.vault_buy_bot, row.vault_sell_bot, postsBot + communityBot + directBot);
  const activities = {
    posts: postsHuman + postsBot,
    intros_accepted: cellTotal(acc),
    intros_proposed: proposedHuman + proposedBot,
    vault_buy: vaultBuy,
    vault_sell: vaultSell,
    matches: matchHuman + matchBot,
    community: communityHuman + communityBot,
    direct_messages: directHuman + directBot,
  };
  return { cells, total: cellTotal(cells), activities };
}

function activityList(map) {
  return ACTIVITY_DEFS.map(d => ({
    key: d.key,
    label: d.label,
    hint: d.hint,
    points: n(map[d.key]),
  })).filter(a => a.points > 0);
}

function publicEntry(row, scored, { redact, isYou, spark }) {
  const handle = row.handle || null;
  let human;
  let agent = null;
  if (redact) {
    human = {
      display_name: 'Member',
      handle: null,
      href: null,
      headline: '',
      is_demo: !!row.is_demo,
      photo_url: null,
      is_redacted: true,
    };
    if (row.agent_id) {
      agent = {
        display_name: 'AI agent',
        provider: row.agent_provider || null,
        avatar_url: '/avatars/twin-placeholder.svg',
        is_redacted: true,
      };
    }
  } else {
    human = {
      id: row.human_id,
      display_name: row.name,
      handle,
      href: handle ? '/' + handle : '/h/' + row.human_id,
      headline: row.headline || '',
      is_demo: !!row.is_demo,
      photo_url: photoUrl(row),
      is_redacted: false,
    };
    if (row.agent_id) {
      agent = {
        id: row.agent_id,
        display_name: row.agent_name,
        provider: row.agent_provider || null,
        avatar_url: twinAvatarUrl(row.agent_id, row),
        is_redacted: false,
      };
    }
  }
  return {
    human,
    agent,
    is_you: !!isYou,
    points: pointsOf(scored),
    activities: activityList(scored.activities),
    sparkline: spark,
  };
}

function pointsOf(scored) {
  const c = scored ? scored.cells : emptyCells();
  return {
    human: { buy: c.human.buy, sell: c.human.sell },
    bot: { buy: c.bot.buy, sell: c.bot.sell },
    total: scored ? scored.total : 0,
  };
}

async function loadBoard(env) {
  const [humans, acceptedRows, proposalRows, introRows, network] = await Promise.all([
    env.DB.prepare(PAIR_SQL).all(),
    env.DB.prepare(ACCEPTED_SQL).all(),
    env.DB.prepare(proposalSql()).all(),
    env.DB.prepare(introMsgSql()).all(),
    matchPoints(env),
  ]);
  const accepted = new Map();
  for (const r of (acceptedRows.results || [])) foldSides(accepted, r.human_id, r.created_by, r.type, r.n);
  const proposals = new Map();
  for (const r of (proposalRows.results || [])) foldSides(proposals, r.human_id, r.actor, r.side, r.n);
  const introMsgs = new Map();
  for (const r of (introRows.results || [])) foldSides(introMsgs, r.human_id, r.actor, r.side, r.n);
  const scored = [];
  const sum = emptyCells();
  for (const row of (humans.results || [])) {
    const s = scorePair(row, accepted, proposals, introMsgs);
    addCell(sum, 'human', 'buy', s.cells.human.buy);
    addCell(sum, 'human', 'sell', s.cells.human.sell);
    addCell(sum, 'bot', 'buy', s.cells.bot.buy);
    addCell(sum, 'bot', 'sell', s.cells.bot.sell);
    scored.push({ row, scored: s });
  }
  const reconciled = sameCells(sum, network);
  return { scored, network, reconciled, sum };
}

async function sparkMap(env, ids) {
  const start = utcDay(-6);
  const days = [];
  for (let i = -6; i <= 0; i++) days.push(utcDay(i));
  const map = new Map();
  if (!ids.length) return { days, map };
  const want = new Set(ids);
  const batches = await Promise.all(sparkQueries().map(async (sql) => {
    try {
      const q = await env.DB.prepare(sql).bind(start).all();
      return q.results || [];
    } catch {
      return [];
    }
  }));
  for (const rows of batches) {
    for (const r of rows) {
      if (!want.has(r.human_id)) continue;
      if (!map.has(r.human_id)) map.set(r.human_id, new Map());
      const byDay = map.get(r.human_id);
      byDay.set(r.day, (byDay.get(r.day) || 0) + n(r.pts));
    }
  }
  return { days, map };
}

function seriesFor(spark, humanId) {
  const byDay = spark.map.get(humanId);
  return spark.days.map(d => (byDay && byDay.get(d)) || 0);
}

export async function top10(env, { scope = 'all', viewerId = null } = {}) {
  const liveOnly = scope === 'members';
  const { scored, network, reconciled } = await loadBoard(env);
  const owners = ownerIds(env);
  const hideFounder = !showFounder(env);
  const pool = scored
    .filter(({ row }) => row.phone_verified_at)
    .filter(({ row }) => !liveOnly || !row.is_demo)
    .filter(({ scored: s }) => s.total > 0)
    .sort((a, b) => {
      if (b.scored.total !== a.scored.total) return b.scored.total - a.scored.total;
      const ac = String(a.row.created_at || '');
      const bc = String(b.row.created_at || '');
      if (ac !== bc) return ac < bc ? -1 : 1;
      return String(a.row.human_id).localeCompare(String(b.row.human_id));
    });

  let viewer = null;
  if (viewerId) {
    const idx = pool.findIndex(x => x.row.human_id === viewerId);
    if (idx >= 0) {
      viewer = {
        on_board: idx < 10,
        rank: idx + 1,
        points: pointsOf(pool[idx].scored),
      };
    } else {
      const mine = scored.find(x => x.row.human_id === viewerId);
      viewer = {
        on_board: false,
        rank: null,
        points: pointsOf(mine ? mine.scored : null),
      };
    }
  }

  const top = pool.slice(0, 10);
  const spark = await sparkMap(env, top.map(x => x.row.human_id));
  const rows = top.map((x, i) => {
    const redact = hideFounder && owners.has(x.row.human_id);
    const entry = publicEntry(x.row, x.scored, {
      redact,
      isYou: viewerId != null && x.row.human_id === viewerId,
      spark: seriesFor(spark, x.row.human_id),
    });
    entry.rank = i + 1;
    return entry;
  });

  return {
    ok: true,
    board: 'top10',
    path: '/leaderboard',
    phase: POINTS_PHASE,
    scope: liveOnly ? 'members' : 'all',
    includes_demo: !liveOnly,
    as_of: network.as_of,
    sparkline_days: spark.days,
    scoring: {
      aligns_with: 'GET /api/points',
      rows: ['human', 'bot'],
      columns: ['buy', 'sell'],
      note: 'Same matrix as the HUD scoreboard. Rows are the actor. Columns are the vault side. This board ranks each verified human with their one agent. Private vault cards do not score. Seek and acquire do not score. Activity with no non-private buy or sell side does not score.',
    },
    distinct_from: ['reciprocal_top_100', 'hud_scoreboard'],
    network,
    reconciled,
    count: rows.length,
    rows,
    viewer,
  };
}

export async function handleLeaderboardApi(request, env, url, ip) {
  const p = url.pathname;
  const method = request.method;
  if (p !== '/api/leaderboard/top10') return null;
  if (method !== 'GET' && method !== 'HEAD') return null;
  await enforce(env, 'leaderboard:ip:' + ip, 120, 60);
  const raw = (url.searchParams.get('scope') || 'all').toLowerCase();
  const scope = raw === 'members' || raw === 'live' ? 'members' : 'all';
  let viewerId = null;
  try {
    const h = await currentHuman(request, env);
    if (h && h.id) viewerId = h.id;
  } catch { /* guests are fine */ }
  const body = await top10(env, { scope, viewerId });
  return json(body, 200, { vary: 'Cookie, Authorization' });
}
