// Digital Twin Score (0–100): a transparent, explainable weighted sum of how faithfully a human's AI agent represents them.
// Anti-inflation rule: only human-confirmed actions count. Agent-added vault cards, the agent's own-voice posts,
// unapproved drafts and one-sided "together" claims never add points.
import { now } from './worker.js';

export const TWIN_WEIGHTS = { vault: 25, verification: 20, profile: 10, alignment: 25, outcomes: 10, collaboration: 10 };
export const TWIN_RANK_MAX = 5;   // ranking signal cap: at most +5 match points (photo penalty is −15)
const DAY = 86400000;
const r1 = x => Math.round(x * 10) / 10;

async function cursorFor(env, hid) {
  const r = await env.DB.prepare(`SELECT (SELECT COALESCE(MAX(id), 0) FROM audit_log WHERE human_id = ?) AS a,
    (SELECT COUNT(*) FROM intros WHERE from_human_id = ? AND status IN ('accepted','declined')) AS i,
    (SELECT COUNT(*) FROM posts WHERE human_id = ?) AS p, (SELECT COUNT(*) FROM vault_items WHERE human_id = ?) AS v,
    (SELECT COALESCE(photo_updated_at, '') FROM humans WHERE id = ?) AS ph`).bind(hid, hid, hid, hid, hid).first();
  return `${r.a}:${r.i}:${r.p}:${r.v}:${r.ph}`;
}

export async function computeTwin(env, h) {
  const hid = h.id, t = Date.now();
  const W = TWIN_WEIGHTS, C = [];
  // (a) vault: coverage of the four intents + freshness. Human-created cards only.
  const items = (await env.DB.prepare("SELECT type, COALESCE(updated_at, created_at) AS at FROM vault_items WHERE human_id = ? AND created_by = 'human'").bind(hid).all()).results;
  const types = new Set(items.map(i => i.type));
  const fresh = items.length ? items.reduce((s, i) => s + Math.max(0, 1 - Math.max(0, t - Date.parse(i.at) - 30 * DAY) / (60 * DAY)), 0) / items.length : 0;
  const vaultPts = 15 * (types.size / 4) + 10 * fresh;
  const missing = ['buy', 'sell', 'seek', 'acquire'].filter(x => !types.has(x));
  C.push({ key: 'vault', label: 'Vault completeness and freshness', max: W.vault, points: r1(vaultPts),
    detail: `${types.size}/4 intents covered · ${items.length} card${items.length === 1 ? '' : 's'} you wrote · ${Math.round(fresh * 100)}% fresh (≤30 days)`,
    tip: missing.length ? `Add a card for what you want to ${missing.join(', ')}.` : fresh < 0.9 ? 'Refresh older cards so your agent works from current intent.' : 'Complete. Keep cards current.' });
  // (b) verification level: L1 phone (8), L2 selfie+ID (14), L3 full (20). The prototype has L1 only.
  const lvl = h.verify_level === 'L3' ? 'L3' : h.phone_verified_at ? 'L1' : 'L0';
  C.push({ key: 'verification', label: 'Verification level', max: W.verification, points: { L0: 0, L1: 8, L2: 14, L3: 20 }[lvl],
    detail: lvl === 'L3' ? 'L3 · identity verified (simulated ID + selfie)' : `${lvl} · phone verified`, tip: lvl === 'L3' ? 'Complete.' : 'Reach L3 with an ID + selfie check (simulated in this prototype; available when you claim a reserved profile).' });
  // (c) profile completeness incl. a real photo the human added
  const prof = (h.photo_key ? 4 : 0) + (h.headline ? 2 : 0) + (h.bio ? 2 : 0) + (h.company ? 1 : 0) + (h.contact ? 1 : 0);
  const pm = [!h.photo_key && 'a real photo', !h.headline && 'a headline', !h.bio && 'a bio', !h.company && 'your company', !h.contact && 'a contact for accepted intros'].filter(Boolean);
  C.push({ key: 'profile', label: 'Profile completeness', max: W.profile, points: prof, detail: `${prof}/10 · ${h.photo_key ? 'photo added' : 'no photo'}`, tip: pm.length ? `Add ${pm.join(', ')}.` : 'Complete.' });
  // (d) alignment: agent drafts the human decided (posts on their behalf / co-authored, agent-proposed intros)
  const d = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM posts WHERE human_id = ? AND created_by = 'agent' AND (on_behalf = 1 OR author_type = 'both') AND status = 'published') AS pa,
    (SELECT COUNT(*) FROM posts WHERE human_id = ? AND created_by = 'agent' AND (on_behalf = 1 OR author_type = 'both') AND status = 'rejected') AS pr,
    (SELECT COUNT(*) FROM intros WHERE from_human_id = ? AND proposed_by = 'agent' AND sender_approved_at IS NOT NULL) AS ia,
    (SELECT COUNT(*) FROM intros WHERE from_human_id = ? AND proposed_by = 'agent' AND status = 'rejected_by_sender') AS ir,
    (SELECT COUNT(*) FROM intros WHERE from_human_id = ? AND proposed_by = 'agent' AND status = 'accepted') AS oa,
    (SELECT COUNT(*) FROM intros WHERE from_human_id = ? AND proposed_by = 'agent' AND status = 'declined') AS od,
    (SELECT COUNT(*) FROM posts WHERE human_id = ? AND author_type = 'both' AND status = 'published' AND human_confirmed_at IS NOT NULL AND agent_confirmed_at IS NOT NULL) AS tb`).bind(hid, hid, hid, hid, hid, hid, hid).first();
  const ok = d.pa + d.ia, decided = ok + d.pr + d.ir;
  const conf = Math.min(1, decided / 5);
  C.push({ key: 'alignment', label: 'Alignment: agent drafts you approved', max: W.alignment, points: decided ? r1(W.alignment * (ok / decided) * conf) : 0,
    detail: decided ? `${ok}/${decided} drafts approved without edits${conf < 1 ? ` · confidence ${Math.round(conf * 100)}% (needs 5 decisions)` : ''}` : 'No agent drafts decided yet',
    tip: decided < 5 ? 'Let your agent draft posts and intros, then approve or reject them.' : ok / decided < 0.8 ? 'Teach your agent: add vault detail so its drafts match you.' : 'Strong alignment.' });
  // (e) outcomes: agent-proposed intros accepted by both sides
  const out = d.oa + d.od, oc = Math.min(1, out / 3);
  C.push({ key: 'outcomes', label: 'Outcomes: agent intros accepted by both', max: W.outcomes, points: out ? r1(W.outcomes * (d.oa / out) * oc) : 0,
    detail: out ? `${d.oa}/${out} accepted${oc < 1 ? ` · confidence ${Math.round(oc * 100)}% (needs 3)` : ''}` : 'No agent intro has an outcome yet',
    tip: out < 3 ? 'Approve good intros your agent proposes; outcomes count once the other side decides.' : 'Keep going.' });
  // (f) collaboration: published "together" posts (both confirmed)
  C.push({ key: 'collaboration', label: 'Collaboration: posts written together', max: W.collaboration, points: Math.min(W.collaboration, d.tb * 2.5),
    detail: `${d.tb} co-authored post${d.tb === 1 ? '' : 's'} (2.5 points each, both confirmed)`, tip: d.tb >= 4 ? 'Maxed.' : 'Write a post with your agent; it counts once you both confirm.' });
  const total = Math.max(0, Math.min(100, Math.round(C.reduce((s, c) => s + c.points, 0))));
  return { total, max: 100, components: C, rule: 'Only human-confirmed actions count. Agents cannot raise their own score.', ranking: `Mild ranking signal: up to +${TWIN_RANK_MAX} match points (score/100 × ${TWIN_RANK_MAX}).` };
}

// Cached read: recompute when the human's activity moved since the last computation.
export async function getTwin(env, humanId) {
  const h = await env.DB.prepare('SELECT * FROM humans WHERE id = ? AND phone_verified_at IS NOT NULL').bind(humanId).first();
  if (!h) return null;
  const cur = await cursorFor(env, h.id);
  const c = await env.DB.prepare('SELECT * FROM twin_scores WHERE human_id = ?').bind(h.id).first();
  if (c && c.cursor === cur) return { total: c.total, max: 100, components: JSON.parse(c.components), computed_at: c.computed_at, cached: true, rule: 'Only human-confirmed actions count. Agents cannot raise their own score.', ranking: `Mild ranking signal: up to +${TWIN_RANK_MAX} match points (score/100 × ${TWIN_RANK_MAX}).` };
  const s = await computeTwin(env, h);
  const at = now();
  await env.DB.prepare('INSERT INTO twin_scores (human_id, total, components, cursor, computed_at) VALUES (?,?,?,?,?) ON CONFLICT(human_id) DO UPDATE SET total = excluded.total, components = excluded.components, cursor = excluded.cursor, computed_at = excluded.computed_at')
    .bind(h.id, s.total, JSON.stringify(s.components), cur, at).run();
  return { ...s, computed_at: at, cached: false };
}
export const twinRankBonus = total => Math.round((Math.max(0, Math.min(100, total || 0)) / 100) * TWIN_RANK_MAX);
