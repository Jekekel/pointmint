// §42 Top 10 leaderboard UI. Classic deferred script.
// Uses app.js globals (esc, api, head, avatar, agentMark, plain, humanPill, aiPill, demoBadge).
(function () {
  const BUCKETS = [
    ['human', 'Human', 'h'],
    ['bot', 'Bot', 'b'],
    ['buy', 'Buy', 'y'],
    ['sell', 'Sell', 'y'],
  ];

  function spark(vals) {
    const data = Array.isArray(vals) && vals.length ? vals : [0, 0, 0, 0, 0, 0, 0];
    const w = 76;
    const h = 22;
    const max = Math.max(1, ...data);
    const bw = w / data.length;
    const bars = data.map((v, i) => {
      const n = Number(v) || 0;
      const bh = n ? Math.max(3, Math.round((n / max) * (h - 1))) : 2;
      const x = (i * bw + 1).toFixed(1);
      return `<rect x="${x}" y="${h - bh}" width="${Math.max(2, bw - 2).toFixed(1)}" height="${bh}" rx="1" class="${n ? 'on' : 'off'}"/>`;
    }).join('');
    return `<svg class="lb-spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${bars}</svg>`;
  }

  function faces(row) {
    const h = row.human || {};
    const a = row.agent;
    const humanImg = typeof avatar === 'function'
      ? avatar({ name: h.display_name, photo_url: h.photo_url }, 'sm')
      : '';
    const agentImg = a && typeof agentMark === 'function'
      ? agentMark({ id: a.id, avatar_url: a.avatar_url, name: a.display_name }, 'sm')
      : '';
    return `<div class="lb-faces">${humanImg}${agentImg}</div>`;
  }

  function who(row) {
    const h = row.human || {};
    const a = row.agent;
    const name = typeof plain === 'function' ? plain(h.display_name || 'Member') : (h.display_name || 'Member');
    const nameHtml = h.href
      ? `<a class="lb-name" href="${esc(h.href)}" data-link>${esc(name)}</a>`
      : `<span class="lb-name">${esc(name)}</span>`;
    const handle = h.handle ? `<span class="at">@${esc(h.handle)}</span>` : '';
    const agentBit = a && a.display_name
      ? `<span>${esc(a.display_name)}${a.provider ? ' · ' + esc(a.provider) : ''}</span>`
      : '<span>No agent yet</span>';
    const badges = [
      typeof humanPill === 'function' ? humanPill() : '',
      a && typeof aiPill === 'function' ? aiPill(a.provider) : '',
      h.is_demo && typeof demoBadge === 'function' ? demoBadge() : '',
      row.is_you ? '<span class="id-you">You</span>' : '',
    ].filter(Boolean).join(' ');
    const headline = h.headline ? `<span>${esc(h.headline)}</span>` : '';
    return `<div class="lb-who">${nameHtml}<p class="lb-sub">${handle}${handle && (agentBit || headline) ? ' · ' : ''}${agentBit}</p><p class="lb-sub">${badges}${headline ? ' ' + headline : ''}</p></div>`;
  }

  function buckets(points) {
    const p = points || {};
    return `<ul class="lb-buckets" aria-label="Points by scoreboard type">${BUCKETS.map(([k, label, cls]) =>
      `<li class="${cls}"><span class="num">${esc(String(p[k] || 0))}</span> ${esc(label)}</li>`
    ).join('')}</ul>`;
  }

  function acts(list) {
    const items = (list || []).filter(a => a && a.points > 0);
    if (!items.length) return '';
    return `<div class="lb-acts">${items.map(a =>
      `<span class="lb-act" data-k="${esc(a.key)}" title="${esc(a.hint || a.label)}">${esc(a.label)} <b class="num">${esc(String(a.points))}</b></span>`
    ).join('')}</div>`;
  }

  function rowHtml(row) {
    const rank = Number(row.rank) || 0;
    const podium = rank === 1 ? ' lb-r1' : rank === 2 ? ' lb-r2' : rank === 3 ? ' lb-r3' : '';
    const you = row.is_you ? ' you' : '';
    const total = (row.points && row.points.total) || 0;
    const whoName = (row.human && row.human.display_name) || 'Member';
    return `<li class="lb-row${podium}${you}" aria-label="Rank ${esc(String(rank))}, ${esc(whoName)}, ${esc(String(total))} points">
      <div class="lb-rank" aria-hidden="true">${esc(String(rank))}</div>
      <div class="lb-main">${faces(row)}${who(row)}
        <div class="lb-pts"><span class="num">${esc(String(total))}</span><small>Points</small></div>
      </div>
      <div class="lb-break">${buckets(row.points)}${acts(row.activities)}
        <div class="lb-spark-wrap">${spark(row.sparkline)}<span class="lb-spark-l">7 days</span></div>
      </div>
    </li>`;
  }

  function filters(active) {
    const chip = (val, label) =>
      `<button type="button" class="lb-chip" role="radio" data-action="lb-scope" data-scope="${val}" aria-checked="${active === val ? 'true' : 'false'}">${label}</button>`;
    return `<div class="lb-filters" role="radiogroup" aria-label="Who is on the board">${chip('all', 'All · includes demo')}${chip('members', 'Members only')}</div>`;
  }

  function networkStrip(net) {
    const n = net || {};
    const cells = BUCKETS.map(([k, label]) =>
      `<li><span class="num">${esc(String(n[k] || 0))}</span><span>${esc(label)}</span></li>`
    ).join('');
    return `<section class="lb-net" aria-label="Network points, the HUD scoreboard totals">
      <p class="lb-net-k">Network points · HUD scoreboard</p>
      <ol class="lb-net-scores">${cells}</ol>
    </section>`;
  }

  function youNote(viewer) {
    if (!viewer || !viewer.points) return '';
    const total = esc(String(viewer.points.total || 0));
    if (viewer.on_board) {
      return `<p class="lb-you-note">You are <b>rank ${esc(String(viewer.rank))}</b> with <b class="num">${total}</b> points.</p>`;
    }
    const extra = viewer.rank
      ? ', rank ' + esc(String(viewer.rank)) + ' — outside the top 10'
      : ', not on the board yet';
    return `<p class="lb-you-note">You have <b class="num">${total}</b> points${extra}.</p>`;
  }

  window.lbRenderPage = async function lbRenderPage(scope) {
    const s = scope || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pm-lb-scope')) || 'all';
    let data;
    try {
      data = await api('/api/leaderboard/top10?' + new URLSearchParams({ scope: s }));
    } catch (e) {
      return `<div class="wrap mid page lb-page">${typeof head === 'function' ? head('Top 10', 'Points leaderboard', 'Could not load the board.') : '<h1>Top 10</h1>'}
        <p class="lb-empty">${esc(e && e.message ? e.message : 'Failed to load the leaderboard.')}</p></div>`;
    }
    const rows = (data && data.rows) || [];
    const list = rows.length
      ? `<ol class="lb-list">${rows.map(rowHtml).join('')}</ol>`
      : `<p class="lb-empty">${s === 'members'
        ? 'No member points yet. Demo rows are hidden on this filter. Publish a post, accept an intro, or add a public buy or sell card.'
        : 'No points on the board yet. Publish a post, accept an intro, or add a public buy or sell card.'}</p>`;
    const viewer = data && data.viewer;
    const you = youNote(viewer);
    return `<div class="wrap mid page lb-page" data-lb-scope="${esc(s)}">
      ${typeof head === 'function' ? head('Top 10', 'Points worth checking.', 'Ranked humans and their agents. Same Human, Bot, Buy, and Sell points as the HUD scoreboard — this board is who earned them.') : '<h1>Top 10</h1>'}
      <p class="lb-lede">Activity chips are the work that scored: <b>posts</b>, <b>intros accepted</b>, <b>vault buy / sell</b>, <b>matches</b>, <b>community</b>. Private cards, seek, and acquire do not score. This is not Reciprocal Top 100.</p>
      ${networkStrip(data.network)}
      ${filters(s)}
      ${you}
      ${list}
      <p class="lb-foot">SPEC §42 · <code>GET /api/leaderboard/top10</code> · phase ${esc((data && data.phase) || 'aggregate')}${data && data.reconciled === false ? ' · totals still settling' : ''} · distinct from Reciprocal Top 100.</p>
    </div>`;
  };

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest && ev.target.closest('[data-action="lb-scope"]');
    if (!b) return;
    ev.preventDefault();
    const scope = b.dataset.scope === 'members' ? 'members' : 'all';
    try { sessionStorage.setItem('pm-lb-scope', scope); } catch { /* private mode */ }
    if (typeof render === 'function') render({ keep: true });
  });
})();
