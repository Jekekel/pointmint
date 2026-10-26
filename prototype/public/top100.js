// Reciprocal Top 100 UI. Classic deferred script; shares app.js globals (esc, api, ME, avatar, humanLink, groupLabel, …).
P.up = P.up || '<path d="m6 14 6-6 6 6"/>';
P.down = P.down || '<path d="m6 10 6 6 6-6"/>';
P.top100 = '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1.2-3.4 3.5-5 6.5-5s5.3 1.6 6.5 5"/><path d="M17.5 4.5 19 6l2.5-2.5"/><path d="M3.5 11.5h3M3.5 14.5h2"/>';

function t100Chip(e) {
  if (e.reciprocated) {
    const rank = e.their_rank_of_owner != null ? ` · #${e.their_rank_of_owner}` : '';
    return `<span class="t100-chip yes" title="They list this member back${rank}"><span class="dot" aria-hidden="true"></span>Reciprocated</span>`
      + `<span class="t100-chip mutual" title="Mutual Top 100">Mutual</span>`;
  }
  return `<span class="t100-chip no" title="They have not listed this member back"><span class="dot" aria-hidden="true"></span>Not reciprocated</span>`;
}

function t100Row(e, { editable = false } = {}) {
  const c = e.contact;
  const moves = editable
    ? `<div class="t100-move">
        <button type="button" data-action="t100-up" data-id="${esc(c.id)}" aria-label="Move up" ${e.rank <= 1 ? 'disabled' : ''}>${icon('up')}</button>
        <button type="button" data-action="t100-down" data-id="${esc(c.id)}" aria-label="Move down">${icon('down')}</button>
        <button type="button" class="btn small quiet" data-action="t100-remove" data-id="${esc(c.id)}" data-name="${esc(plain(c.name))}">Remove</button>
      </div>`
    : '';
  return `<li class="t100-row" data-id="${esc(c.id)}">
    <span class="t100-rank num" aria-label="Rank ${esc(e.rank)}">#${esc(e.rank)}</span>
    <div class="t100-who">${avatar(c, 'sm')}<div class="meta"><a class="name" href="/h/${esc(c.id)}" data-link>${esc(c.name)}</a>
      <span class="sub">${esc(c.headline || c.company || c.level || '')}${c.is_demo ? ' · Demo' : ''}</span></div></div>
    <div class="t100-flags">${t100Chip(e)}</div>${moves}</li>`;
}

/** Profile middle-column section. Guests see a sign-in lock; signed-in see the owner's list with reciprocity. */
function top100Section(M) {
  const h = M.subject && M.subject.human;
  if (!h) return '';
  const T = M.data && M.data.top100;
  if (!T) {
    return `<section class="section-gap t100-sec" aria-labelledby="t100Title">${groupLabel('<span id="t100Title">Reciprocal Top 100</span>', 'Verified members')}
      <div class="panel t100-locked">${icon('lock')}<span>Sign in as a verified member to see ${esc(plain(h.name))}'s Reciprocal Top 100 and whether each contact lists them back.</span>
      <a class="btn small" href="/signup" data-link>Sign in</a></div></section>`;
  }
  const aside = `<span class="t100-head-aside"><span class="t100-stat"><b class="num">${esc(T.count)}</b>/${esc(T.max)}</span>
    <span class="t100-stat"><b class="num">${esc(T.reciprocated_n)}</b> reciprocated</span>
    ${T.is_own ? '<a class="link-more small" href="/dashboard#top100" data-link>Edit' + chev() + '</a>' : ''}</span>`;
  const body = T.entries.length
    ? `<ul class="t100-list panel">${T.entries.map(e => t100Row(e)).join('')}</ul>`
    : `<div class="panel t100-empty">${T.is_own ? 'Your Reciprocal Top 100 is empty. Add verified contacts from your dashboard.' : 'No contacts listed yet.'}</div>`;
  return `<section class="section-gap t100-sec" aria-labelledby="t100Title">${groupLabel('<span id="t100Title">Reciprocal Top 100</span>', aside)}
    <p class="t100-note">For each person on this list, <b>Reciprocated</b> means they also have ${esc(plain(h.name))} in <i>their</i> Reciprocal Top 100.</p>
    ${body}</section>`;
}

/** Dashboard editor (owner only). Loaded via /api/top100/me + network members for the picker. */
async function top100DashPanel() {
  if (!(ME && ME.signed_in)) return '';
  let list, network;
  try {
    list = await api('/api/top100/me');
    network = await api('/api/network');
  } catch (e) {
    return `<section class="section-gap" id="top100">${groupLabel('Reciprocal Top 100')}<div class="panel t100-empty">${esc(e.message || 'Could not load')}</div></section>`;
  }
  const onList = new Set(list.entries.map(e => e.contact.id));
  const opts = (network.members || [])
    .map(m => m.human)
    .filter(h => h.id !== ME.human.id && !onList.has(h.id))
    .map(h => `<option value="${esc(h.id)}">${esc(h.name)}</option>`)
    .join('');
  const rows = list.entries.length
    ? `<ul class="t100-list panel" id="t100EditList">${list.entries.map(e => t100Row(e, { editable: true })).join('')}</ul>`
    : `<div class="panel t100-empty">Add up to 100 verified humans. Reserved profiles and unverified accounts are rejected.</div>`;
  return `<section class="section-gap t100-editor" id="top100">${groupLabel('Reciprocal Top 100', `<span class="t100-stat"><b class="num">${esc(list.count)}</b>/${esc(list.max)} · <b class="num">${esc(list.reciprocated_n)}</b> reciprocated</span>`)}
    <p class="t100-note">Your public list of up to 100 verified contacts. Each row shows whether they list you back (<b>Reciprocated</b> / <b>Not reciprocated</b>).</p>
    <form id="t100AddForm" class="t100-add panel pad">
      <label for="t100Contact">Add verified contact
        <select id="t100Contact" name="contact_human_id" required ${opts ? '' : 'disabled'}>
          <option value="">${opts ? 'Choose a member…' : 'Everyone you can list is already on your list'}</option>
          ${opts}
        </select>
      </label>
      <button class="btn small" type="submit" ${opts ? '' : 'disabled'}>Add to Top 100</button>
    </form>
    ${rows}</section>`;
}

async function t100ReorderFromDom() {
  const ids = [...document.querySelectorAll('#t100EditList .t100-row')].map(el => el.dataset.id).filter(Boolean);
  await api('/api/top100/reorder', { method: 'PUT', body: { ordered_ids: ids } });
}

document.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-action^="t100-"]');
  if (!b) return;
  const act = b.dataset.action;
  try {
    if (act === 't100-remove') {
      if (!await ask({ title: 'Remove from Reciprocal Top 100?', message: `Remove ${b.dataset.name || 'this contact'} from your list.`, ok: 'Remove', destructive: true })) return;
      await api('/api/top100/' + encodeURIComponent(b.dataset.id), { method: 'DELETE' });
      render();
    } else if (act === 't100-up' || act === 't100-down') {
      const li = b.closest('.t100-row');
      const list = document.getElementById('t100EditList');
      if (!li || !list) return;
      if (act === 't100-up' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
      else if (act === 't100-down' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
      else return;
      await t100ReorderFromDom();
      render();
    }
  } catch (e) { await ask({ title: 'Something went wrong', message: e.message, cancel: null }); }
});

document.addEventListener('submit', async (ev) => {
  const f = ev.target;
  if (f.id !== 't100AddForm') return;
  ev.preventDefault();
  const data = Object.fromEntries(new FormData(f).entries());
  const btn = f.querySelector('button'); if (btn) btn.disabled = true;
  try {
    await api('/api/top100', { method: 'POST', body: { contact_human_id: data.contact_human_id } });
    render();
  } catch (e) {
    let box = f.querySelector('.err'); if (!box) { box = document.createElement('div'); box.className = 'err'; box.setAttribute('role', 'alert'); f.appendChild(box); }
    box.textContent = e.message;
  } finally { if (btn) btn.disabled = false; }
});
