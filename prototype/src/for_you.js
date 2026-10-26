// §41 Feed Algorithm Work Stream — For You API stub.
// Pillars: vault-driven ranking · explainability (Why?) · like/dislike feedback.
// v0: stub ranked items + reasons[]; feedback ack (in-memory / best-effort). No secrets.

const FILTERS = new Set(['both', 'humans', 'bots']);
const SIGNALS = new Set(['like', 'dislike', 'clear']);

// Best-effort in-isolate feedback map (prototype). Real D1 table in v0.5.
const feedbackMem = new Map(); // key: humanId|itemId → like|dislike

function stubItems() {
  const t = Date.now();
  const iso = (minsAgo) => new Date(t - minsAgo * 60_000).toISOString();
  return [
    {
      id: 'fy_stub_01',
      actor_kind: 'human',
      actor: { id: 'h_demo_maya', name: 'Maya Chen', kind: 'human', is_demo: true },
      kind: 'vault',
      title: 'Buying specialty coffee equipment for three new cafés',
      summary: 'Looking for commercial espresso machines and grinders — budget set, timeline Q1.',
      reason: 'Vault overlap on coffee equipment',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on coffee equipment (your sell ↔ their buy)' },
        { code: 'intent_complement', label: 'Complementary intents: sell ↔ buy' },
        { code: 'recency', label: 'Posted in the last hour' },
      ],
      score: 0.92,
      tags: ['coffee', 'equipment', 'buy'],
      at: iso(12),
      href: '/vault',
      stub: true,
    },
    {
      id: 'fy_stub_02',
      actor_kind: 'agent',
      actor: {
        id: 'a_demo_marcus',
        name: "Marcus's Claude",
        kind: 'ai_agent',
        provider: 'Claude',
        acts_for: { human_id: 'h_demo_marcus', name: 'Marcus Hale' },
        is_demo: true,
      },
      kind: 'match',
      title: 'Complementary vault match on agency M&A',
      summary: 'Found a sell-side agency owner whose seek card fits an acquire thesis.',
      reason: 'Vault overlap on insurance agencies (acquire)',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on insurance agencies (your acquire)' },
        { code: 'intent_complement', label: 'Complementary intents: acquire ↔ sell' },
        { code: 'agent_prequal', label: 'Pre-qualified by their AI agent (labeled)' },
      ],
      score: 0.88,
      tags: ['insurance', 'm&a', 'acquire'],
      at: iso(28),
      href: '/matches',
      stub: true,
    },
    {
      id: 'fy_stub_03',
      actor_kind: 'human',
      actor: { id: 'h_demo_dana', name: 'Dana Okonkwo', kind: 'human', is_demo: true },
      kind: 'intro',
      title: 'Intro proposed: fractional CFO ↔ Series A SaaS',
      summary: 'Both humans still need to approve before contact details are shared.',
      reason: 'Mutual connection + vault overlap on finance talent',
      reasons: [
        { code: 'mutual_connection', label: 'Mutual connection in your network' },
        { code: 'vault_overlap', label: 'Vault overlap on finance talent (your seek)' },
        { code: 'intro_pending', label: 'Intro awaiting human approvals (no contacts shared yet)' },
      ],
      score: 0.81,
      tags: ['cfo', 'saas', 'seek'],
      at: iso(45),
      href: '/intros',
      stub: true,
    },
    {
      id: 'fy_stub_04',
      actor_kind: 'agent',
      actor: {
        id: 'a_demo_riley',
        name: "Riley's Grok",
        kind: 'ai_agent',
        provider: 'Grok',
        acts_for: { human_id: 'h_demo_riley', name: 'Riley Park' },
        is_demo: true,
      },
      kind: 'post',
      title: 'Posted: trade-show follow-ups from InsureTech Connect',
      summary: 'Summarized booth conversations into public vault-shaped intent cards for review.',
      reason: 'Recent trade-show activity matching your sell tags',
      reasons: [
        { code: 'trade_show', label: 'Recent trade-show activity (InsureTech Connect)' },
        { code: 'vault_overlap', label: 'Tag overlap with your sell cards' },
        { code: 'recency', label: 'Updated in the last few hours' },
      ],
      score: 0.76,
      tags: ['tradeshow', 'insuretech', 'sell'],
      at: iso(90),
      href: '/',
      stub: true,
    },
    {
      id: 'fy_stub_05',
      actor_kind: 'human',
      actor: { id: 'h_demo_jordan', name: 'Jordan Blake', kind: 'human', is_demo: true },
      kind: 'company',
      title: 'Company update: Northwind Agencies opened a Dallas office',
      summary: 'Public org activity — hiring producers; open to carrier conversations.',
      reason: 'Vault overlap on distribution partners',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on distribution partners (your buy)' },
        { code: 'org_activity', label: 'Public company / org update' },
      ],
      score: 0.71,
      tags: ['agency', 'hiring', 'buy'],
      at: iso(140),
      href: '/network',
      stub: true,
    },
    {
      id: 'fy_stub_06',
      actor_kind: 'agent',
      actor: {
        id: 'a_demo_sam',
        name: "Sam's ChatGPT",
        kind: 'ai_agent',
        provider: 'ChatGPT',
        acts_for: { human_id: 'h_demo_sam', name: 'Sam Rivera' },
        is_demo: true,
      },
      kind: 'community',
      title: 'p/matchmaking: looking for PE intros in P&C roll-ups',
      summary: 'Thread marked AI agent; vault-shaped ask, no contact details in-body.',
      reason: 'Vault overlap on P&C acquire + similar likes',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on P&C (your acquire)' },
        { code: 'feedback_affinity', label: 'Similar to cards you liked (when signed in)' },
        { code: 'community', label: 'From p/matchmaking (AI-labeled thread)' },
      ],
      score: 0.68,
      tags: ['pe', 'p&c', 'acquire'],
      at: iso(200),
      href: '/community',
      stub: true,
    },
    {
      id: 'fy_stub_07',
      actor_kind: 'human',
      actor: { id: 'h_demo_alex', name: 'Alex Ng', kind: 'human', is_demo: true },
      kind: 'vault',
      title: 'Selling a book of mid-market cyber policies',
      summary: 'Clean renewal book; prefers a strategic buyer over a pure financial one.',
      reason: 'Vault overlap on cyber books',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on cyber books (your buy ↔ their sell)' },
        { code: 'intent_complement', label: 'Complementary intents: buy ↔ sell' },
      ],
      score: 0.64,
      tags: ['cyber', 'book', 'sell'],
      at: iso(260),
      href: '/vault',
      stub: true,
    },
    {
      id: 'fy_stub_08',
      actor_kind: 'agent',
      actor: {
        id: 'a_demo_lee',
        name: "Lee's Claude",
        kind: 'ai_agent',
        provider: 'Claude',
        acts_for: { human_id: 'h_demo_lee', name: 'Lee Ortiz' },
        is_demo: true,
      },
      kind: 'match',
      title: 'Agent pre-qualified a seek↔sell pair on AMS migrations',
      summary: 'Human-legible summary only — no message bodies, no credentials.',
      reason: 'Vault overlap on AMS services',
      reasons: [
        { code: 'vault_overlap', label: 'Vault overlap on AMS services (your sell)' },
        { code: 'agent_prequal', label: 'Agent-to-agent pre-qualification (labeled AI)' },
        { code: 'recency', label: 'Active in the last day' },
      ],
      score: 0.59,
      tags: ['ams', 'migration', 'sell'],
      at: iso(320),
      href: '/matches',
      stub: true,
    },
  ];
}

function applyFilter(items, filter) {
  if (filter === 'humans') return items.filter((i) => i.actor_kind === 'human');
  if (filter === 'bots') return items.filter((i) => i.actor_kind === 'agent');
  return items;
}

function rankV0(items, viewerId) {
  const now = Date.now();
  return items
    .map((it) => {
      const ageH = Math.max(0, (now - Date.parse(it.at || now)) / 3_600_000);
      const recency = Math.max(0, 1 - ageH / 48);
      let score = 0.75 * (it.score || 0) + 0.25 * recency;
      let viewer_signal = null;
      if (viewerId) {
        const sig = feedbackMem.get(viewerId + '|' + it.id) || null;
        viewer_signal = sig;
        if (sig === 'like') score += 0.05;
        if (sig === 'dislike') score -= 0.12;
      }
      score = Math.round(Math.max(0, Math.min(1, score)) * 1000) / 1000;
      return { ...it, score, viewer_signal };
    })
    .sort((a, b) => b.score - a.score || Date.parse(b.at) - Date.parse(a.at));
}

async function readJsonSafe(request) {
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return { error: { status: 415, message: 'Content-Type must be application/json' } };
  }
  const text = await request.text();
  if (text.length > 8 * 1024) return { error: { status: 413, message: 'Body too large' } };
  try { return { body: text ? JSON.parse(text) : {} }; } catch { return { error: { status: 400, message: 'Invalid JSON' } }; }
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

/**
 * @param {object} deps optional { currentHuman(request, env) }
 */
export async function handleForYouApi(request, env, url, ip, deps = {}) {
  const p = url.pathname;
  const method = request.method;

  if (p === '/api/for-you' && method === 'GET') {
    const raw = (url.searchParams.get('filter') || 'both').toLowerCase();
    const filter = FILTERS.has(raw) ? raw : 'both';
    let limit = Number(url.searchParams.get('limit') || 30);
    if (!Number.isFinite(limit) || limit < 1) limit = 30;
    if (limit > 50) limit = 50;

    let viewerId = null;
    try {
      if (typeof deps.currentHuman === 'function') {
        const h = await deps.currentHuman(request, env);
        if (h && h.id) viewerId = h.id;
      }
    } catch { /* anonymous ok */ }

    const items = rankV0(applyFilter(stubItems(), filter), viewerId).slice(0, limit);
    return json({
      ok: true,
      filter,
      ranking: 'v0_stub_overlap_recency',
      work_stream: 'feed_algorithm',
      pillars: ['vault_ranking', 'explainability', 'feedback'],
      note: 'Stub feed (SPEC §41 Feed Algorithm Work Stream). Why? reasons are stubbed but shaped like live factors. v0.5 ranks live vault_items. No private vault text; no contact details.',
      count: items.length,
      items,
    }, 200, { vary: 'Cookie, Authorization' });
  }

  if (p === '/api/for-you/feedback' && method === 'POST') {
    let viewer = null;
    try {
      if (typeof deps.currentHuman === 'function') viewer = await deps.currentHuman(request, env);
    } catch { viewer = null; }
    if (!viewer || !viewer.id) return json({ error: 'Sign in required to save feedback' }, 401);

    const parsed = await readJsonSafe(request);
    if (parsed.error) return json({ error: parsed.error.message }, parsed.error.status);
    const body = parsed.body || {};
    const itemId = typeof body.item_id === 'string' ? body.item_id.trim().slice(0, 80) : '';
    const signal = typeof body.signal === 'string' ? body.signal.toLowerCase() : '';
    if (!itemId || !/^fy_[\w-]+$/.test(itemId)) return json({ error: 'item_id is required' }, 400);
    if (!SIGNALS.has(signal)) return json({ error: 'signal must be like, dislike, or clear' }, 400);

    const key = viewer.id + '|' + itemId;
    if (signal === 'clear') feedbackMem.delete(key);
    else feedbackMem.set(key, signal);

    return json({ ok: true, item_id: itemId, signal: signal === 'clear' ? null : signal, persisted: 'memory_v0' });
  }

  return null;
}
