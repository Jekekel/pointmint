// Points HUD — 2×2 matrix (SPEC §43).
// Rows are the actor (human, bot). Columns are the vault side (buy, sell).
// Each scored event is worth one point and lands in exactly one cell. A post or
// thread written together (author "both") is still one Human point and one Bot point.
// Private vault cards never count. Seek and acquire never count.
//
// Weight note: an event that used to increment the flat Human or Bot total, but
// cannot be tied to a non-private buy or sell card, does not score. Vault inventory
// and accepted-intro citations keep their old weight of 1 and are filed by who
// created the card. See SPEC §43.4.
import { json, enforce, now } from './worker.js';

export const POINTS_PHASE = 'aggregate';

const n = v => Math.max(0, Math.trunc(Number(v) || 0));

export function emptyCells() {
  return { human: { buy: 0, sell: 0 }, bot: { buy: 0, sell: 0 } };
}

// More of the actor's own non-private buy/sell cards wins. A tie goes to Buy.
export function dominantSide(buyN, sellN) {
  const buy = n(buyN);
  const sell = n(sellN);
  if (buy > 0 && sell === 0) return 'buy';
  if (sell > 0 && buy === 0) return 'sell';
  if (buy > 0 && sell > 0) return buy >= sell ? 'buy' : 'sell';
  return null;
}

export function addCell(cells, actor, side, pts) {
  const row = actor === 'agent' || actor === 'bot' ? 'bot' : actor === 'human' ? 'human' : null;
  if (!row || (side !== 'buy' && side !== 'sell')) return cells;
  cells[row][side] += n(pts);
  return cells;
}

export function addDominant(cells, actor, buyN, sellN, pts) {
  const side = dominantSide(buyN, sellN);
  if (side) addCell(cells, actor, side, pts);
  return cells;
}

export function cellTotal(cells) {
  return cells.human.buy + cells.human.sell + cells.bot.buy + cells.bot.sell;
}

export function sameCells(a, b) {
  return !!a && !!b
    && a.human.buy === b.human.buy && a.human.sell === b.human.sell
    && a.bot.buy === b.bot.buy && a.bot.sell === b.bot.sell;
}

export function matrixPayload(cells, extra = {}) {
  return {
    human: { buy: cells.human.buy, sell: cells.human.sell },
    bot: { buy: cells.bot.buy, sell: cells.bot.sell },
    total: cellTotal(cells),
    rows: ['human', 'bot'],
    columns: ['buy', 'sell'],
    ...extra,
  };
}

// Dominant side of the non-private buy/sell cards `createdBy` listed for humanIdExpr.
// humanIdExpr is a trusted SQL column reference, never request input.
export function dominantSideSql(humanIdExpr, createdBy) {
  if (createdBy !== 'human' && createdBy !== 'agent') throw new Error('createdBy');
  return `(SELECT CASE
      WHEN buy_n > 0 AND sell_n = 0 THEN 'buy'
      WHEN sell_n > 0 AND buy_n = 0 THEN 'sell'
      WHEN buy_n > 0 AND sell_n > 0 AND buy_n >= sell_n THEN 'buy'
      WHEN sell_n > buy_n THEN 'sell'
      ELSE NULL
    END
    FROM (
      SELECT
        (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = ${humanIdExpr} AND v.visibility <> 'private' AND v.type = 'buy' AND v.created_by = '${createdBy}') AS buy_n,
        (SELECT COUNT(*) FROM vault_items v WHERE v.human_id = ${humanIdExpr} AND v.visibility <> 'private' AND v.type = 'sell' AND v.created_by = '${createdBy}') AS sell_n
    ))`;
}

// Proposer's cited card (from_item) when it scores, otherwise the other cited card.
export const PROPOSAL_SIDE_SQL = `CASE
  WHEN fv.type IN ('buy','sell') AND fv.visibility <> 'private' THEN fv.type
  WHEN tv.type IN ('buy','sell') AND tv.visibility <> 'private' THEN tv.type
  ELSE NULL END`;

// Sender's card on the intro when it scores, otherwise the other cited scoring card.
export const INTRO_MESSAGE_SIDE_SQL = `CASE
  WHEN m.sender_human_id = i.from_human_id AND fv.type IN ('buy','sell') AND fv.visibility <> 'private' THEN fv.type
  WHEN m.sender_human_id = i.to_human_id AND tv.type IN ('buy','sell') AND tv.visibility <> 'private' THEN tv.type
  WHEN fv.type IN ('buy','sell') AND fv.visibility <> 'private' THEN fv.type
  WHEN tv.type IN ('buy','sell') AND tv.visibility <> 'private' THEN tv.type
  ELSE NULL END`;

function createdBy(actor) {
  return actor === 'bot' ? 'agent' : 'human';
}

function vaultCount(actor, side) {
  return `(SELECT COUNT(*) FROM vault_items WHERE type = '${side}' AND visibility <> 'private' AND created_by = '${createdBy(actor)}')`;
}

function acceptedCount(actor, side) {
  return `(SELECT COUNT(*) FROM intros i JOIN vault_items v ON v.id = i.from_item_id OR v.id = i.to_item_id
    WHERE i.status = 'accepted' AND v.type = '${side}' AND v.visibility <> 'private' AND v.created_by = '${createdBy(actor)}')`;
}

function proposalCount(actor, side) {
  return `(SELECT COUNT(*) FROM intros i
    LEFT JOIN vault_items fv ON fv.id = i.from_item_id
    LEFT JOIN vault_items tv ON tv.id = i.to_item_id
    WHERE i.proposed_by = '${createdBy(actor)}' AND (${PROPOSAL_SIDE_SQL}) = '${side}')`;
}

function introMsgCount(actor, side) {
  return `(SELECT COUNT(*) FROM messages m
    JOIN intros i ON i.id = m.intro_id
    LEFT JOIN vault_items fv ON fv.id = i.from_item_id
    LEFT JOIN vault_items tv ON tv.id = i.to_item_id
    WHERE m.sender_type = '${createdBy(actor)}' AND (${INTRO_MESSAGE_SIDE_SQL}) = '${side}')`;
}

function authoredCount(table, actor, side) {
  const authors = actor === 'bot' ? `('agent','both')` : `('human','both')`;
  const alias = table === 'posts' ? 'p' : 't';
  return `(SELECT COUNT(*) FROM ${table} ${alias}
    WHERE ${alias}.status = 'published' AND ${alias}.author_type IN ${authors}
      AND ${dominantSideSql(alias + '.human_id', createdBy(actor))} = '${side}')`;
}

function dmCount(actor, side) {
  return `(SELECT COUNT(*) FROM messages m
    WHERE m.intro_id IS NULL AND m.sender_type = '${createdBy(actor)}'
      AND ${dominantSideSql('m.sender_human_id', createdBy(actor))} = '${side}')`;
}

function cellExpr(actor, side) {
  return [
    vaultCount(actor, side),
    acceptedCount(actor, side),
    proposalCount(actor, side),
    introMsgCount(actor, side),
    authoredCount('posts', actor, side),
    authoredCount('threads', actor, side),
    dmCount(actor, side),
  ].join('\n  + ');
}

export const POINTS_SQL = `SELECT
  ${cellExpr('human', 'buy')} AS human_buy,
  ${cellExpr('human', 'sell')} AS human_sell,
  ${cellExpr('bot', 'buy')} AS bot_buy,
  ${cellExpr('bot', 'sell')} AS bot_sell`;

export async function matchPoints(env) {
  const row = await env.DB.prepare(POINTS_SQL).first();
  const cells = emptyCells();
  addCell(cells, 'human', 'buy', row && row.human_buy);
  addCell(cells, 'human', 'sell', row && row.human_sell);
  addCell(cells, 'bot', 'buy', row && row.bot_buy);
  addCell(cells, 'bot', 'sell', row && row.bot_sell);
  return matrixPayload(cells, {
    phase: POINTS_PHASE,
    includes_demo: true,
    as_of: now(),
  });
}

export async function handlePointsApi(request, env, url, ip) {
  const p = url.pathname, method = request.method;
  if (p !== '/api/points' || (method !== 'GET' && method !== 'HEAD')) return null;
  await enforce(env, 'points:ip:' + ip, 120, 60);
  return json(await matchPoints(env));
}
