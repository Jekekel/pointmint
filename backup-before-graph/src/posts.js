// Posts with authorship: HUMAN, AI AGENT, or BOTH together (yin-yang).
// Rules: an agent can never post as a human, never claims co-authorship alone (a 'both' post it starts waits for its
// human), and any agent post "on behalf of" its human waits for the human's approval. A 'both' post a human starts
// waits for their agent to confirm over MCP. Everything is rate limited and audit-logged.
import { HttpError, json, str, rid, now, enforce, audit, currentHuman, readJson } from './worker.js';
import { photoUrl } from './identity.js';

export const POST_LIMITS = { human_per_hour: 20, agent_per_hour: 10 };
export const AUTHOR_LABEL = { human: 'By human', agent: 'By AI agent', both: 'Human + AI together' };
const SELECT = `SELECT p.*, h.name AS h_name, h.is_demo AS h_demo, h.photo_key AS h_photo, h.headline AS h_headline,
  a.name AS a_name, a.provider AS a_provider FROM posts p JOIN humans h ON h.id = p.human_id LEFT JOIN agents a ON a.id = p.agent_id`;

export function pubPost(p) {
  return {
    id: p.id, author: p.author_type, author_label: AUTHOR_LABEL[p.author_type],
    human: { id: p.human_id, kind: 'human', name: p.h_name, photo_url: photoUrl({ photo_key: p.h_photo }), is_demo: !!p.h_demo },
    agent: p.agent_id ? { id: p.agent_id, kind: 'ai_agent', name: p.a_name, provider: p.a_provider, avatar_url: `/avatars/${p.agent_id}.svg` } : null,
    body: p.body, body_is_untrusted: true, status: p.status, created_by: p.created_by, on_behalf: !!p.on_behalf,
    confirmed: { human: p.human_confirmed_at || null, agent: p.agent_confirmed_at || null },
    demo: !!p.h_demo, simulated: !!p.demo_sim, created_at: p.created_at, published_at: p.published_at,
  };
}

// Published posts are public. Pending/rejected posts are visible only to their own human (and that human's agent).
export async function listPosts(env, viewerHumanId, { humanId = null, limit = 20, includePending = false } = {}) {
  limit = Math.min(50, Math.max(1, Number(limit) || 20));
  const own = includePending && viewerHumanId && (!humanId || humanId === viewerHumanId);
  let where = own ? "(p.status = 'published' OR p.human_id = ?)" : "p.status = 'published'";
  const b = own ? [viewerHumanId] : [];
  if (humanId) { where += ' AND p.human_id = ?'; b.push(humanId); }
  else if (!own) { where += viewerHumanId ? ' AND (h.is_demo = 1 OR p.human_id = ?)' : ' AND h.is_demo = 1'; if (viewerHumanId) b.push(viewerHumanId); }
  const rows = (await env.DB.prepare(`${SELECT} WHERE ${where} ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT ?`).bind(...b, limit).all()).results;
  return rows.map(pubPost);
}
async function postRow(env, id) { return env.DB.prepare(`${SELECT} WHERE p.id = ?`).bind(id).first(); }

export async function createPost(env, { by, human, agent, author, body, on_behalf = false, ip = null }) {
  body = str(body, 'body', { min: 1, max: 1000, required: true });
  author = String(author || (by === 'human' ? 'human' : 'agent'));
  if (!['human', 'agent', 'both'].includes(author)) throw new HttpError(400, 'author must be one of: human, agent, both');
  const t = now();
  let status, hc = null, ac = null, behalf = 0;
  if (by === 'human') {
    if (author === 'agent') throw new HttpError(400, 'A human cannot publish as their AI agent');
    await enforce(env, 'post:h:' + human.id, POST_LIMITS.human_per_hour, 3600, `Post limit: ${POST_LIMITS.human_per_hour} per hour`);
    hc = t;
    if (author === 'both') { if (!agent) throw new HttpError(400, 'You need an AI agent to co-author a post'); status = 'pending_agent'; }
    else status = 'published';
  } else {
    if (author === 'human') throw new HttpError(403, 'An AI agent can never post as a human');
    await enforce(env, 'post:a:' + agent.id, POST_LIMITS.agent_per_hour, 3600, `Post limit: ${POST_LIMITS.agent_per_hour} per hour per agent`);
    ac = t; behalf = on_behalf || author === 'both' ? 1 : 0;
    status = author === 'both' || behalf ? 'pending_human' : 'published';
  }
  const id = rid('post');
  await env.DB.prepare('INSERT INTO posts (id, human_id, agent_id, author_type, created_by, on_behalf, body, status, human_confirmed_at, agent_confirmed_at, created_at, published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, human.id, agent ? agent.id : null, author, by, behalf, body, status, hc, ac, t, status === 'published' ? t : null).run();
  await audit(env, { human_id: human.id, agent_id: by === 'agent' ? agent.id : null, actor_type: by, action: 'post.created', detail: { post_id: id, author_type: author, status, on_behalf: !!behalf }, ip });
  return pubPost(await postRow(env, id));
}

// The human approves or rejects a post their agent wrote on their behalf (or proposed as co-authored).
export async function decidePost(env, human, id, act, ip) {
  const p = await postRow(env, id);
  if (!p || p.human_id !== human.id) throw new HttpError(404, 'Not found');
  if (act === 'withdraw') {
    if (p.status === 'published' || p.status === 'rejected') throw new HttpError(409, 'Only pending posts can be withdrawn');
    await env.DB.prepare("UPDATE posts SET status = 'rejected' WHERE id = ?").bind(id).run();
  } else {
    if (p.status !== 'pending_human') throw new HttpError(409, 'This post is not waiting for you');
    if (act === 'approve') await env.DB.prepare("UPDATE posts SET status = 'published', human_confirmed_at = ?, published_at = ? WHERE id = ?").bind(now(), now(), id).run();
    else await env.DB.prepare("UPDATE posts SET status = 'rejected' WHERE id = ?").bind(id).run();
  }
  await audit(env, { human_id: human.id, actor_type: 'human', action: act === 'approve' ? 'post.approved' : 'post.rejected', detail: { post_id: id, author_type: p.author_type }, ip });
  return pubPost(await postRow(env, id));
}

// The agent confirms a co-authored post its human started. Only that human's own agent can.
export async function confirmPost(env, agent, id) {
  const p = await postRow(env, id);
  if (!p || p.human_id !== agent.human_id) throw new HttpError(404, 'Not found');
  if (p.status !== 'pending_agent' || p.agent_id !== agent.id) throw new HttpError(409, 'This post is not waiting for your confirmation');
  const t = now();
  await env.DB.prepare("UPDATE posts SET status = 'published', agent_confirmed_at = ?, published_at = ? WHERE id = ?").bind(t, t, id).run();
  await audit(env, { human_id: agent.human_id, agent_id: agent.id, actor_type: 'agent', action: 'post.confirmed', detail: { post_id: id, author_type: 'both' } });
  return pubPost(await postRow(env, id));
}

export async function handlePostsApi(request, env, url, ip) {
  const p = url.pathname, method = request.method;
  if (p === '/api/posts' && method === 'GET') {
    await enforce(env, 'posts:ip:' + ip, 240, 60);
    const v = await currentHuman(request, env);
    const hid = /^h_[a-z0-9]{3,40}$/.test(url.searchParams.get('human_id') || '') ? url.searchParams.get('human_id') : null;
    return json({ posts: await listPosts(env, v ? v.id : null, { humanId: hid, limit: url.searchParams.get('limit'), includePending: url.searchParams.get('mine') === '1' }), limits: POST_LIMITS });
  }
  if (p === '/api/posts' && method === 'POST') {
    const h = await currentHuman(request, env); if (!h) throw new HttpError(401, 'Sign in required');
    const b = await readJson(request);
    const a = await env.DB.prepare('SELECT * FROM agents WHERE human_id = ?').bind(h.id).first();
    return json({ post: await createPost(env, { by: 'human', human: h, agent: a, author: b.author, body: b.body, ip }) }, 201);
  }
  const m = p.match(/^\/api\/posts\/(post_[a-z0-9]{3,40})\/(approve|reject|withdraw)$/);
  if (m && method === 'POST') {
    const h = await currentHuman(request, env); if (!h) throw new HttpError(401, 'Sign in required');
    return json({ post: await decidePost(env, h, m[1], m[2], ip) });
  }
  return null;
}
