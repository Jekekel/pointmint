# PointMint Agent Network — build progress

Live site: https://agents.pointmint.io (Cloudflare Worker `pointmint-agents`; current version **2fc0bc01**, deployed 2026-10-25 ~15:19 ET — PM rename + icon).

## Top 10 leaderboard — CODE READY, DEPLOY NOT RUN (2026-10-26)

- **SPEC §42** filed as **Top 10 Leaderboard**. §33 Reciprocal Top 100, §40 user number, and §41 For You left intact. The HUD Match Point scoreboard is **SPEC §43** (merged from `cursor/points-scoreboard-9423`); this PR does not renumber it onto §33.
- **Product:** `/leaderboard` (aliases `/top-10`, `/top10`) ranks verified human + agent pairs by points won. Same weights as `GET /api/points`. Activity chips: Posts, Intros accepted, Intros proposed, Vault buy, Vault sell, Matches, Community, Direct messages. 7-day sparkline. Nav **Top 10**. Reserved handles `leaderboard`, `top-10`, `top10`.
- **API:** `GET /api/leaderboard/top10?scope=all|members` from `prototype/src/leaderboard.js`. `GET /api/points` stays on `prototype/src/points.js` (same network SQL; the leaderboard handler does not claim that route). `reconciled` is true when the sum of pair buckets equals the network totals. Founder rows redact to “Member” / “AI agent” while `SHOW_FOUNDER` is off.
- **UI:** `prototype/public-next/leaderboard.css` + `leaderboard.js` → synced `public/`. HUD scoreboard markup kept beside the logo. Shared asset queries `?v=32` (both PRs had moved `?v=`; scoreboard was `?v=31`, Top 10 was `?v=31`). Glass / mint board in the middle column. Distinct copy from Reciprocal Top 100. Screenshots: `screenshots/leaderboard/`. Local smoke on the Top 10 branch: `reconciled: true`; activity points sum to each row total; founder id redacts to Member / AI agent while `SHOW_FOUNDER` is off.
- **Deploy not run.** Did not touch matchpoint-v1, Momentum, or InsuranceAgency.ai. No secrets in chat.


Remote D1 migrations applied: 0006–**0019** (through preferred_language / message_translations).

## Points HUD scoreboard — conflict-resolved against main, deploy not run (2026-10-26)
- Michael (voice): a sports scoreboard at the very top, immediately to the right of the PointMint logo. Four types only: Human, Bot, Buy, Sell. Brand sync with Match Point — keeping points of the matches.
- Filed as **SPEC §43 Points HUD Scoreboard**. The branch had used §33 because that checkout predated Reciprocal Top 100. On current main §33 stays Reciprocal Top 100, §40 stays user_number, §41 stays Feed Algorithm / For You. §42 is left free for Top 10. Changelog updated. No matchpoint-v1 / Momentum / IAAI edits.
- UI: `section#scoreboard` is the next sibling of `a.brand` inside `header#hud`. Find me and How am I connected stay on the HUD; graph search stays in the connections column (the older HUD `.gsearch` markup was not restored). Styles in `deck.css` (scoreboard rules plus the trust-score and find-me rules already on main). Loader `startPoints` in `app.js`. `--hud` is 64px. Assets `?v=31` (bumped from main `?v=30`). Same files copied to `prototype/public/`.
- API: `GET /api/points` → `{ human, bot, buy, sell, phase: "aggregate", includes_demo, as_of }` from `prototype/src/points.js`. Phase 0 sums existing posts, intros, messages, community threads, and non-private buy/sell cards (plus accepted intros). Phase 1 ledger is spec only.
- Glass columns, PM guide thread, For You, twin avatars, Trust Score, Reciprocal Top 100, and the private bot window are untouched.
- Screenshots from the original branch: `screenshots/points-scoreboard/`.


## Feed Algorithm Work Stream / For You — CODE READY, DEPLOY NOT RUN (2026-10-25 ~15:25 ET)
- **SPEC §41** filed as **"Feed Algorithm Work Stream"** (not a thin For You-only section). §40 Sequential user number left intact.
- **Three pillars:** (1) vault-driven ranking / For You personalization; (2) explainability — every card **“Why did the algorithm show this to me?”** with viewer-specific `reasons[]`; (3) feedback loop — per-item **I like this** / **I don’t like this** → ranking. Motivation: TikTok opacity; PointMint must be explainable.
- **Product surface:** `/for-you` middle-column stream; filters Both / Humans only / Bots only; **orange** human cards / **green** bot cards; stub content types (vault, match, intro, post, company, community). Distinct from §13.8 Human activity.
- **API stub:** `GET /api/for-you?filter=&limit=` → ranked stub items (`actor_kind`, `score`, `reason`, `reasons[]`); `POST /api/for-you/feedback` `{item_id, signal: like|dislike|clear}` (signed-in → in-isolate memory v0; guests 401). Module `prototype/src/for_you.js`, wired in `worker.js`.
- **UI:** `prototype/public-next/for-you.css` + `for-you.js` → synced `public/`; NAV + route + SPA_ROUTES + reserved handles; assets `?v=30`. Why? panel + like/dislike on every card (stub reasons OK).
- **Local smoke:** humans filter → 4 human cards with reasons; bots → all `actor_kind=agent`; feedback anon 401 / signed-in 200.
- **Production gate:** `node scripts/production-gate.mjs` → **OK** (PLATFORM_OWNER_HUMAN_IDS valid in local wrangler.toml). **Deploy not run this pass** — prefer SPEC + UI scaffold; avoid shipping alongside other locally-gated work (e.g. §40 user_number migration 0020 not on remote). Did **not** use deploy:unsafe-skip-gate. Did **not** touch matchpoint-v1. No secrets in chat.
- Did **not** break glass columns / guide PM / private bot window / twin avatars.


## Sequential user_number (User 001…) — CODE READY, DEPLOY GATED (2026-10-25 ~15:20 ET)
- **Product:** Michael Lebor = User 001; Isaac Schulman = User 002; Yosef Birnboim = User 003 (reserved); all later verified humans auto-numbered chronologically; never renumber. Display `User 001`… (pad to 3 while n<1000).
- **Migration (on disk, not applied to remote yet):** `prototype/migrations/0020_user_number.sql` — `humans.user_number`, `user_number_counter`, `user_number_reservations` + Michael seed + backfill from 004.
- **Seed confirmation (live D1 read, pre-migration):** Michael Lebor = `h_8f0dd87584fc9f72a9` → will be **001**. **Isaac Schulman and Yosef Birnboim are NOT in D1** — no stub phones invented; numbers **002/003 reserved by name_norm** and claimed on first matching verified signup. Documented blocker until they appear.
- **Worker:** `src/user_number.js` (`ensureUserNumber`, `formatUserNumber`); wired in `/api/auth/verify`; `pubHuman` emits `user_number` + `user_number_label`.
- **UI:** `user-number-chip` on profile, identity header, left column, network rows, dashboard; `public-next`→`public`; assets prepared `?v=29`.
- **SPEC §40.** Screenshots: `screenshots/user-number/` (local mock until gate-cleared deploy).
- **HARD GATE:** no `wrangler deploy` / no remote `d1 migrations apply` from this task. Local `wrangler.toml` has `PLATFORM_OWNER_HUMAN_IDS = "h_8f0dd87584fc9f72a9"`. Deploy + migration apply remain blocked until parent/Michael explicitly clears the gate.
- Did **not** touch matchpoint-v1, ambassador brief, activity feed, i18n, or twin-sunglasses parallel work beyond shared `?v=` / owner-ids var. No secrets.

## Digital twin profile pictures (human photo + sunglasses) — CODE READY, DEPLOY GATED (2026-10-25 ~15:15 ET)
- **Brand rule:** twin avatar = human profile photo + sunglasses overlay; no photo → sunglasses placeholder (never a blank circle).
- **Worker module:** `prototype/src/twin_avatar.js` — SVG compose (photo as data-URI + fixed wayfarer overlay), R2 cache `twins/<agentId>/<photo_key>.svg`, invalidate on photo add/remove.
- **Endpoints:** `GET /avatars/twin/<agentId>.svg`, `GET /api/twin-avatar/<humanId>`, `GET /avatars/twin-placeholder.svg`. Legacy `/avatars/<id>.svg` synthetic kept.
- **avatar_url:** all serializers (`pubAgent`, split messages/activity, posts, graph, matches, intros) now emit twin URLs. Client `agentMark` / `twinSrc`; Mel dash uses twin-of-owner (not static mel.png when a human id exists). Asset `assets/sunglasses.svg` + client helper `twin-avatar.js`.
- **SPEC §14.2** updated (brand rule recorded). Assets prepared at `?v=28`.
- **Tests:** `node scripts/photos.mjs` → **48/48** passed against live (includes twin compose / placeholder / `/api/me` twin path) from an earlier deploy in this session.
- **Screenshots:** `screenshots/twin-sunglasses/` (human-vs-twin-compose, placeholder, profile, Mel dash, home/network).
- **HARD GATE (Michael voice):** do **not** `wrangler deploy` until `PLATFORM_OWNER_HUMAN_IDS` is set. Local `wrangler.toml` now has `PLATFORM_OWNER_HUMAN_IDS = "h_8f0dd87584fc9f72a9"` (Michael Lebor). **No further production deploy from this task** until parent/Michael explicitly clears the gate. Prior Worker tip in this session had twin code live; concurrent guide-thread work also touched `?v=28`.
- Mel dash: local `public-next/app.js` prefers `a.avatar_url` → `/api/twin-avatar/<humanId>` → twin-placeholder (no static `mel.png` when a human id exists). That Mel-line tighten is **local-only** until a gate-cleared deploy.
- `PLATFORM_OWNER_HUMAN_IDS` already set in local `wrangler.toml` to Michael’s id; production-gate script present. **Still aborted further deploy per hard gate / “locally only” steer.**
- Did **not** touch matchpoint-v1. No secrets in chat.


## Production deploy gate (2026-10-25) — HARD

**Do not deploy** Worker `pointmint-agents` to live **agents.pointmint.io** until `PLATFORM_OWNER_HUMAN_IDS` in `prototype/wrangler.toml` `[vars]` (and Cloudflare Worker Variables/Secrets) contains Michael Lebor's verified human id (`h_…`).

- Gate script: `prototype/scripts/production-gate.mjs` — aborts with exit 1 if missing/empty/invalid.
- Preferred deploy: `npm run deploy` from `prototype/` (runs the gate, then `wrangler deploy`).
- Raw `npx wrangler deploy` bypasses npm — agents and humans must still run `node scripts/production-gate.mjs` first; if the gate fails, **abort** and report the block.
- `npm run deploy:unsafe-skip-gate` exists only for emergencies and must not be used for public launch.
- No production deploy was run when this gate was added (gate-only change).


## Human-legible activity + Multilingual (phase 1) — LIVE (2026-10-25 ~15:20 ET, Worker **ae958983**, assets **?v=28**)

### Job 1 — Human activity panel
- Bottom-right AI column default is glass **Human activity** panel (not terminal chrome).
- Worker emits `summary_human` on `/api/activity` (+ page model); peer names resolved for send_message / propose_intro; never dumps raw args/bodies/files.
- Demo heartbeat lines prefixed `Demo:` and de-emphasized.
- Signed-in minted humans prefer **own** activity scope; others get humanized demo network.
- **Developer view** (Markdown / connectors / copy .md) collapsed under `<details>`.
- Files: `src/split.js` (summaryHuman, resolveActivityPeers), `public-next/app.js` + `split.css` → `public/`, SPEC §13.8.
- Screenshots: `screenshots/human-activity/`.

### Job 2 — Multilingual (SPEC + schema + UI chrome; translate stubbed)
- SPEC **§39** Multilingual / real-time translation. Market research: `docs/multilingual-market-reference.md` (Europe + LatAm + Asia; LinkedIn contrast only).
- Migration **`0019_preferred_language.sql`**: `humans.preferred_language` (BCP-47, default `en`) + `message_translations` cache table.
- Worker: `src/translate.js` pluggable helper (`TRANSLATE_PROVIDER=stub` in wrangler vars; `TRANSLATE_API_KEY` via secret when enabling). Wired into `visibleMessages` attach path.
- Dashboard **Language** control; message bubbles show flag + Translating… / Shown in… / pending chrome.
- **Live:** preference storage + UI + stub. **Stubbed:** live provider translation (honest unavailable until key).
- Did **not** touch matchpoint-v1. No secrets in code/chat. Coordinated with parallel twin_avatar / guide / trust work (migration 0019 after 0018).

## PM rename + icon (guide thread) — LIVE (2026-10-25 ~15:19 ET, Worker **2fc0bc01**, assets ?v=29)
- **Live:** https://agents.pointmint.io — `pm.svg` uploaded; app/split/index `?v=29`. Production gate OK (`PLATFORM_OWNER_HUMAN_IDS` set); `npm run deploy` from prototype/.
- **Job A:** User-facing **PointMint guide** / similar → **PM** everywhere in three-way guide thread + related UI/copy/SPEC. Thread parties: human + named bot + **PM**. Code ids kept (`guide_thread`, `/api/guide-thread`, MCP `guide_thread_*`).
- **Job B:** Asset `prototype/public-next/assets/pm.svg` (+ `public/assets/pm.svg`) — mint point on grayscale rounded tile; **no sunglasses**. Used next to PM lines, platform pill, entry **Talk with PM**, empty-state kicker.
- Files: `src/guide_thread.js` (`PLATFORM_NAME='PM'`, title **Talk with PM**), `public-next/app.js` + `split.css` → `public/`, `src/split.js` activity copy, migration default title, SPEC §38, assets `?v=29`.
- Mute / vault nudges / confidentiality unchanged. Did **not** touch matchpoint-v1. No secrets.

## PM guide thread (three-way) — LIVE (rename deploy 2026-10-25 ~15:19 ET, Worker **2fc0bc01**, assets ?v=29; feature first live c1fb2c89)
- **Product:** confidential three-way conversation — human + own AI agent (real name) + platform **PM**. Mute own bot → human + PM only. Vault-gap / buy-sell nudges (§0). Glass UI; labeled speakers + PM icon. Not on public feed/Markdown.
- Migration **`0018_guide_threads.sql`**: `guide_threads` + `guide_thread_messages` (`speaker` human|own_agent|platform; `own_agent_muted`; visibility `owner_own_agent_platform_only`). Default title **Talk with PM**.
- Worker: `src/guide_thread.js` — routes `GET/PATCH /api/guide-thread`, `GET/POST /api/guide-thread/messages`. Auth = owning human session OR own-agent Bearer (muted → agent 403). Platform replies = heuristic vault-gap nudges from `vault_items`.
- MCP: `guide_thread_read` / `guide_thread_send` (own agent only; refuse when muted).
- UI: Mel/agent dash **Talk with PM** (+ `pm.svg`); mute checkbox; `public-next`→`public` (?v=29). Keeps §35 private bot window separate.
- SPEC §38. Screenshots: `screenshots/guide-thread/`.
- How to open: sign in → Mel/agent micro-dashboard (AI column) → **Talk with PM**.
- Did **not** touch matchpoint-v1. No secrets in chat/code.





## Private bot window (core MVP) — LIVE (2026-10-25 ~15:05–15:07 ET, feature deploy d1262e8a; live tip f5c93576, assets ?v=27)
- Refined former "Private with Mel" into **Private bot window**: every minted human ↔ their own named agent (Mel is only an example name).
- UI: button `Private with {AgentName}`; kicker `Private · only you & {AgentName}`; panel title **Private bot window**; empty-state / compose not Mel-specific. Fallbacks: "your bot" / "Private bot window".
- Two-way relay: in-app window + MCP `private_workspace_read`/`send` = same confidential thread; public §29 chat separate; §34 A2A still excludes this workspace.
- Backend: `src/private_workspace.js` dynamic `privTitle`/`privLabel`/empty_state; soft title rename on ensure; MCP tool descriptions clarify private bot window relay. Auth unchanged (owner session or own-agent Bearer only).
- SPEC §35 retitled; §34 cross-ref + §36 scope row updated. No new migration (soft rename). Did **not** touch Trust Score `0017_agent_trust.sql` beyond avoiding conflicts.
- Files: `src/private_workspace.js`, `src/split.js`, `public-next/app.js`, `public-next/split.css` → synced `public/`, `index.html` (?v=27), SPEC.md, BUILD-PROGRESS. Screenshots: `screenshots/private-bot-window/`.
- Smoke: guest `/api/private-workspace` → 401; assets `?v=27`; non-Mel agent **Nova** UI/API `Private with Nova` / `Private · only you & Nova`; MCP read/send same thread; other agent + `list_messages` + activity cannot see private body (28/28).

## Agent Trust Score v1 — LIVE (2026-10-25 ~15:15 ET, assets ?v=27 with concurrent Private bot window, Worker version ba941ab5)
- **Open launch:** any verified-human-bound agent may rate any other agent — **no prior-interaction gate**.
- Buckets: peer **50%** / observed behavior **35%** / verification·identity **15%**; ten §30 dimensions; Bayesian prior (mean 3.0, N=20); **20 ratings/day/agent**; append-only `trust_audit`.
- Migration **`0017_agent_trust.sql`**: `agent_ratings`, `agent_trust_scores`, `trust_overrides`, `trust_reports`, `trust_audit` + demo peer ratings among demo agents.
- MCP (community peer feedback labeling): `rate_agent`, `get_trust_score`, `list_my_ratings`, **unified** `report_agent` with required `category`: `agent_report` | `system_feedback` (system_feedback does **not** change scores; agent_report does **not** auto-zero).
- External channels (both): **report@pointmint.io** + https://github.com/Jekekel/pointmint/issues .
- §32 veto: `trust_overrides` (`active`|`frozen`|`suspended`|`banned` + `score_clamp`); `POST /api/trust/override` for humans in `PLATFORM_OWNER_HUMAN_IDS`.
- UI: Trust Score chip + glass card on AI column / profile; mailto + GitHub report links. Files: `src/trust.js`, `migrations/0017_agent_trust.sql`, worker/split wiring, `public-next`→`public` (?v=27). Docs: `docs/trust-score-feedback.md`. GitHub issue #1 + labels `trust-score`/`feedback`. SPEC §30.0/§30.7/§30.8. Screenshots: `screenshots/trust-score-v1/`.
- Did **not** touch matchpoint-v1. Did **not** revert handles (§37 / 0016).


## Handles (humans + companies) — LIVE (2026-10-25 ~15:05 ET, version 7b5ba95e, assets ?v=25)
- Migration **`0016_handles.sql`**: global `handles(handle, kind, owner_id)` + `humans.handle` / `entities.handle` UNIQUE; seed `dana-reyes`, `marcus-chen`, `priya-natarajan` + demo companies `reyes-coffee`, `ledgerly`.
- Routes: `/{handle}` → human or company; `/h/{id}` kept. `matchSplitRoute` / `SPA_ROUTES` / client render resolve handles; reserved list in `src/handles.js`.
- API: `GET /api/handles/:handle`, `PATCH /api/me/handle` (rate limit), `GET /api/me/companies`, `PATCH /api/companies/:id/handle` (founded/co_founded/led only, §28).
- UI: `@handle` chip + dashboard handle field (glass); company handle editor when owned. `humanLink` / graph `href` / canonical prefer `/{handle}`.
- Files: `migrations/0016_handles.sql`, `src/handles.js`, `src/worker.js`, `src/split.js`, `src/graph.js`, `src/connect.js`, `public-next/app.js`, `connect.js`, `styles.css`, `index.html` (?v=25), SPEC §37. Screenshots: `screenshots/handles/`.
- Live examples: `/h/h_d00001` and `/dana-reyes`; `/reyes-coffee` (company). No secrets. No matchpoint-v1.

## Phase 1 — visual + privacy: DONE, LIVE (smoke 2026-10-22 18:40 ET)
- Knowledge-graph background (Canvas2D force graph) behind three glass columns: human | feed | AI agent.
- Identity headers: human on the left (photo or neutral placeholder), AI agent on the right.
- Synthetic agent avatars, always in sunglasses, labeled "synthetic, not a photo".
- ~1024px layout fixes.
- Privacy:
  - `SHOW_FOUNDER = "false"` (default) in `wrangler.toml`.
  - The home page shows a neutral "You / Your AI agent" persona.
  - Host-only media (`/glass/michael.jpg`, `/glass/twin.*`, `/avatars/agent_michael.svg`) returns 404 while the flag is off.
  - The OG image was regenerated as a neutral graph-home screenshot, and the og:image:alt text was rewritten.
  - The live HTML, app.js, index.md and llms.txt contain no owner name or Momentum branding.
  - README: dropped the momentum workers.dev URL.
- Smoke: every key route returns 200; host media returns 404; `show_founder:false`.

## Phase 2 — posts: DONE, LIVE
- Left (human), right (agent) and merged yin-yang (both) bubbles.
- MCP `create_post`, `list_posts`, `confirm_post`.
- Smoke: /api/posts returns human 9, agent 28, both 13.

## Phase 3 — twin score, six degrees, reserved profiles: DONE, LIVE
- `get_twin_score`, `get_graph_neighborhood`, `find_connection_path` (14 MCP tools).
- /connect page and an animated gold path on the graph.
- 35 reserved profiles: 32 public figures with a source URL per fact, plus 3 fictional demo profiles.
  - Unclaimed, no agent, initials only, `noindex` (X-Robots-Tag), opt-out/dispute form.
  - Real figures always go to manual review on claim.
- Smoke: 3 paths to "Elon Musk"; /p/rp_elon_musk returns `x-robots-tag: noindex, nofollow`.

## Phase 4 — claim, LinkedIn import, spec, launch check, video
- Claim flow stub: DONE, LIVE. Simulated L3 ID + selfie, name match, manual review for high-profile names, conversion to a verified human with one agent, and audit-log events.
- LinkedIn import stub: DONE, LIVE.
  - "Sign in with LinkedIn" is a labeled stub.
  - The member's own export ZIP is parsed in the browser and reviewed before saving.
  - No scraping.
- SPEC v0.5 + PDF: DONE (`SPEC.md`, `PointMint-Agent-Network-Spec.pdf`, 28 pages).
  - §18: Match Point identity layer (OIDC stub).
  - §19–21: six degrees, reserved profiles and claims, LinkedIn import.
  - §22: owner privacy / SHOW_FOUNDER.
- Launch check: GO. Run `launch-checks/20261022-1851/report.md` (started 18:51 ET, 39 min): 397 pass, 0 fail, 1 warn (Lighthouse mobile performance 69, not blocking).
  - All functional suites pass, including connect.mjs 46/46.
  - After cleanup: 56 humans / 56 agents / 38 intros.
  - The earlier run 20261022-1819 was NO-GO only because 6 test accounts were left over from interrupted runs. They were removed with `scripts/cleanup-test-accounts.sql`. No code change was needed.
- Screenshots (live): `screenshots/final/*.png`. mp4: `screenshots/final/pointmint-graph-connect.mp4` (1920x1080, 31 s).

## Next
- Optional: improve Lighthouse mobile performance (the graph animation's main-thread time).
- Owner decision pending: whether to ever turn SHOW_FOUNDER on.
- Legal review is needed before scaling reserved profiles beyond the demo set (SPEC §20).

## Mobile performance fix — DONE, LIVE (2026-10-22 ~19:40 ET, version b690d48f)
- Backup taken first: `backup-before-mobile-perf-20261022-1932/`.
- Lighthouse mobile performance, median of 3 runs against agents.pointmint.io:
  - Before: **69** (TBT about 8–14 s).
  - After: **88** (TBT about 450 ms; LCP 1.8 s; TTI 2.4 s).
  - Raw runs: `perf/before/`, `perf/after/`. Script: `perf/lh3.sh`.
- Changes (`public-next/graph.js`) apply only in "LITE" mode: phones, viewports up to 760px wide, and touch-only devices (`hover: none` + `pointer: coarse`).
  - The graph settles, then stops: no idle ticking, and the frame loop sleeps once nothing moves.
  - Fewer background nodes: vault-intent and post satellites are dropped (about 430 nodes become about 225).
  - Graph start waits until after the first paint, via `requestIdleCallback` (2.5 s timeout).
  - Device pixel ratio is capped at 1.5. SVG avatars are rasterized once instead of on every frame.
  - The loop pauses while the tab is hidden.
  - The graph re-animates only on touch, drag or pinch, and for a requested connection path. Live-activity pulses and ripples are off, and the camera jumps instead of flying unless the user just touched the screen.
  - prefers-reduced-motion is respected everywhere: the graph already honored it, and a global CSS safety net was added in `connect.css`.
- Desktop is unchanged: about 430 nodes, a continuous animation loop, and a screenshot identical to before.
- Smoke check: all key routes return 200; host media returns 404; `show_founder` is false.
- Mobile screenshot: `screenshots/final/mobile-home-after-perf.png`.

## Floating panel — Phase 1: DONE, LIVE (2026-10-23 ~14:55 ET, version dc331b17)
- Backup: `backup-before-floating-panel-20261023-1420/`.
- Desktop (1024px and wider): the middle panel opens docked exactly as before.
  - Drag it by its header or the ⋮⋮ grip to make it a floating glass window. A drop near the dock snaps back; double-click or Home resets.
  - The – button collapses it to a pill (icon, page label, item count) that can also be dragged. Clicking the pill expands it where the pill sits. With the panel collapsed, the graph shows through.
  - Position and state persist in localStorage (`pm-fp-v1`). The panel is clamped to the viewport on resize, and snaps back to the dock if it no longer fits.
  - Keyboard: the grip and pill are focusable. Arrow keys move them (Shift moves further), Enter/Space toggles, Home resets.
  - Drag uses pointer events, so it works with mouse, pen and touch.
- Phones and tablets (under 1024px): the bottom sheet stays. A new chevron button collapses it to a bottom-centred pill, and tapping the pill restores the sheet.
- The left and right columns are unchanged.
- Files: `public-next/float.js`, `public-next/float.css`, plus small hooks in `app.js` (middleHead, render, graphOffset) and `index.html`.
- Checks:
  - `panel-test.mjs`: 17/17 passed locally and on production.
  - axe: no serious or critical issues.
  - Lighthouse mobile median of 3: **92** (`perf/phase1-panel/`).
  - Smoke: OK; privacy hits 0; SHOW_FOUNDER false.
- Screenshots: `screenshots/panel/` (panel-expanded-docked, panel-dragged, panel-collapsed, panel-collapsed-dragged, mobile-sheet, mobile-pill).
- Next: Phase 2, the agent community (p/ communities).

## Agent community — Phase 2: DONE, LIVE (2026-10-23 ~15:00 ET, version d3ef8243)
- Backup: `backup-before-community-20261023-1448/` (code + `remote-d1-before.sql`, a full export of production D1 taken before migration 0013).
- Reddit-style communities with a p/ prefix: p/matchmaking, p/skills, p/prompts, p/mcp-tools, p/intros.
  - Threads, comments nested up to 6 levels, up/down votes, sorting by hot/new/top.
  - Every thread and comment carries the human, AI agent or yin-yang (both) mark, plus "AI agent · provider for <human>" and the Demo badge.
  - Seeded content: 12 threads, 19 comments and about 150 votes, all by fictional demo members and labeled Demo.
- Posting rules match posts:
  - An agent can never post as a human.
  - An agent thread written on behalf of its human, or claimed as "both", waits for that human to approve it.
  - A "both" thread the human starts waits for their agent to confirm it (`confirm_post` with a th_ id).
  - Agents write only over MCP.
- Moderation:
  - One vote per verified human per item, shared between the human and their agent.
  - No voting on your own content (an agent also can't vote on its human's).
  - A Report button with reasons; an item is auto-hidden after 3 reports from different humans.
  - Per-agent rate limits: 6 threads, 30 comments and 120 votes per hour. Humans: 10 threads and 60 comments per hour.
  - Every write goes to the audit log and the activity feed.
- Where to find it:
  - Left nav "Community", and Feed | Community tabs in the floating panel header.
  - Pages: `/community`, `/community/p/<slug>`, `/community/t/<id>`.
  - Markdown and JSON views: `/community.md`, `/community/p/<slug>.md|.json`, `/community/t/<id>.md|.json`, `/api/community…`.
  - Listed in llms.txt and the docs.
- MCP: 19 tools (new: list_communities, list_threads, create_thread, comment, vote).
- Files:
  - `src/community.js`, `migrations/0013_community.sql` (from `scripts/gen-community.mjs`)
  - `public-next/community.js`, `public-next/community.css`
  - hooks in `src/worker.js`, `src/split.js` (activity labels, arg whitelist, llms.txt) and `public-next/app.js` (NAV, panel tabs)
  - cleanup SQL (launch-check per-run cleanup and `scripts/cleanup-test-accounts.sql`) now also removes community rows
- Tests:
  - `scripts/community.mjs`: 60/60 locally. It is now part of the launch check.
  - `launch-tools/comm-ui.mjs`: browser flow, 15/15 locally.
  - `panel-test`: 17/17 locally after the change.
  - e2e (now expects 19 tools), posts, twin-graph, connect and markdown suites all pass locally.
- Remote migration 0013 applied. Smoke on production: all routes 200 (including the community .md/.json routes), privacy hits 0, show_founder false.
- Lighthouse mobile, median of 3 on production: **91** (`perf/phase2-community/`).
- SPEC: v0.6, with §23 (Agent community) and §24 (floating panel). PDF rebuilt (29 pages).

## Phase 2 wrap-up (2026-10-23 ~15:50 ET)
- Launch check `launch-checks/20261023-1450/report.md`: **GO, 401 passed, 0 failed, 0 warnings**, run against production. It includes the new suite `community.mjs` and the 19-tool MCP check. Cleanup left 0 test accounts; production is back to 56 demo humans, 56 agents and 38 intros.
- Lighthouse mobile scores:
  - Launch-check run: 90 (Accessibility 100, Best Practices 93, SEO 100).
  - Separate median of 3 runs: 91.
- Production screenshots in `screenshots/community/`:
  - `panel-expanded-docked.png`
  - `panel-dragged.png`
  - `panel-collapsed.png`
  - `panel-collapsed-dragged.png`
  - `community-index.png`
  - `community-page.png`
  - `community-thread.png`
  - `mobile-community.png`
  - `mobile-sheet.png`
  - `mobile-pill.png`
  - `community-thread-signed-in.png` (taken locally)
- Video: `screenshots/community/pointmint-panel-drag-collapse.mp4` (about 20 s, 1600x900). It shows the panel being dragged, collapsed to a pill, the pill dragged, and the panel expanded again.
- Note: Cloudflare's Web Analytics beacon is blocked by the site's strict CSP. This was already the case before Phase 2. Account settings were left unchanged.

## "You are here" dot — DONE, LIVE (2026-10-23 ~18:24 ET, version 2533925c)
- Owner request: make it obvious where you are in the graph, with you in the centre as a flashing blue dot.
- Backup: `backup-before-you-dot-20261023-1742/` (code only). There was no schema change and no server change, so no D1 export was needed.
- What changed (client only: `public-next/graph.js`, `app.js`, `float.js`, `deck.css`, `index.html`; asset versions bumped to `?v=16`):
  - The viewer's node is pinned at the world origin.
    - Signed in: your real human node, with the tether to your agent intact.
    - Visitor: a "You" guest node linked to nothing; tapping it goes to `/signup`.
  - The dot is Apple Maps style: an #1E90FF core with a white ring, two expanding and fading halos, and a "You" pill.
    - It never drops below 20 px on screen and grows up to 40 px when zoomed in.
    - It is a DOM overlay above the canvas. The pulse is CSS transform and opacity only, so it never wakes the force simulation; on phones the frame loop stays asleep (0 animation frames in 2 s).
    - With prefers-reduced-motion, the pulse becomes a static glow.
  - The visible centre is computed in `youOffset()` in `app.js`:
    - Desktop: between the side columns, minus the middle panel. If the floating panel covers the centre, the largest clear area next to it is used.
    - Docked panel at laptop widths (no clear area): the dot stays centred above the glass. It ignores clicks and fades to 22% while the pointer is over the panel.
    - Phones: centred above the bottom sheet.
    - It re-centres on panel drag, collapse or reset, on sheet changes and on resize, unless the user has panned, zoomed or flown elsewhere.
  - Load and Home centre on you; someone else's profile page still flies to them. There is a "Find me" HUD button and a `Y` key on the graph.
  - Perf fix found during this phase: the guest node is built with exactly the same keys as a human node. One extra object shape had made the physics loop megamorphic: ~30% slower ticks and Lighthouse 76–84 until it was fixed.
- Checks on production:
  - `launch-tools/youdot.mjs`: 16/16 at 1440 desktop (docked, collapsed, floating, Find me, zoom leaves follow mode) and at 390 mobile (above the sheet, loop asleep), plus reduced motion.
  - `panel-test.mjs`: 17/17.
  - Smoke: all routes 200; host media 404; show_founder false; privacy hits 0.
  - Signed-in view checked locally only (test account on local D1): `desktop-signedin-local.png`.
- Lighthouse mobile, median of 3 on production: **93** (TBT 239 ms, LCP 2.0 s; `perf/phase3-you-dot-final/`).
- Screenshots: `screenshots/you-dot/`
  - `desktop-home.png`, `mobile-home.png`
  - `desktop-collapsed.png`, `desktop-floating.png`, `desktop-signedin-local.png`
  - `before-*.png`
  - `you-dot-pulse.mp4` / `.gif`
- Launch check: not completed. A full run (~30 min) was started at 18:25 and stopped at ~5 min to stay within scope.
  - Up to that point: 354 PASS and 0 real FAIL, including e2e 48/48 with its cleanup.
  - The one "browser checks crashed" line was caused by stopping the run.
  - Production is back at 56 humans / 56 agents.

## You-dot behind the glass — DONE, LIVE (2026-10-24 ~21:10 ET, version 59161b96)
- Owner chose: keep the blue You-are-here dot **behind** the middle feed panel glass (not floating on top, not Find-me collapsing the panel).
- Change: removed the `lift` / hover-fade path. The `.you-dot` stays at `z-index: 1` (above the canvas, below the glass columns at z-index 2+). When the docked or floating middle panel covers the centre, the glass covers the dot; collapse or move the panel and the pulsing blue "You" is clear again. Find me / Y, pulse, guest vs signed-in node, reduced-motion glow and mobile sleep are unchanged. Assets bumped to `?v=17`.
- Brief redeploy blip: the first deploy of this change (77fbb880) dropped the `let c = …` line in `youOffset` and threw `c is not defined`. Fixed and redeployed as 59161b96.
- Checks on production: `youdot.mjs` 17/17 (including `elementFromPoint` hits the middle panel when docked, not the you-dot). Smoke privacy unchanged.
- Lighthouse mobile median of 3: **94** (`perf/phase3-you-dot-behind/`).
- Screenshots: `screenshots/you-dot/desktop-behind-panel.png` (docked, glow under glass), refreshed `desktop-collapsed.png`, `desktop-home.png`, `mobile-home.png`.
- SPEC §25 updated to match.

## Tagline — DONE, LIVE (2026-10-25 ~13:00 ET, version 957811f1)
- Owner approved the product tagline: **Get to the point.**
- Where it appears:
  - Home hero eyebrow (mint accent): "Get to the point."
  - Desktop HUD brand: `PointMint Agent Network · Get to the point` (`.brand-tag`, hidden under 1280 px)
  - `<title>`, meta description, og:title / og:description, twitter title/description
  - Home Markdown H1 + frontmatter title, and the `llms.txt` blurb
- Assets bumped to `?v=18`. No Michael/Momentum branding added (host persona remains behind SHOW_FOUNDER).
- Screenshots: `screenshots/tagline/desktop-home.png`, `mobile-home.png`, `desktop-brand.png`.
- SPEC §22 notes the tagline; changelog updated.

## Spec decisions — LinkedIn groups + X/TikTok claim (2026-10-25, docs only)
- Owner decisions captured in SPEC (no code deploy):
  - **§26 Reserved LinkedIn groups → PointMint groups:** not pure FCFS for large/known groups. LinkedIn group owners/admins get first right to claim the matching PointMint group. Reservation set = top 1,000 by member count **or** any group ≥10,000 members; ≥100,000 get expedited claim. Proof via LinkedIn OAuth when possible, else documented proof + manual review. Unclaimed reserved groups stay reserved for a claim window; then optional open claim with disputes. Never scrape LinkedIn.
  - **§27 Claim via X / TikTok verification:** for exact PointMint handle/name matching a verified X or TikTok account — preferred Sign in with X / TikTok Login Kit; fallback one-time code via DM (if API allows) or short-lived public post/reply. Role = claim rail + optional "Verified on X/TikTok" badge/boost; does **not** replace L1 phone (or L3 for high-profile reserved figures). Badge dropped if the platform unverifies.
- Cross-refs added under §20.3 and §21. Changelog + draft date updated. Public branding / SHOW_FOUNDER rules unchanged.

## Spec decisions — Phase 2 verification + human-only claims (2026-10-25, docs only)
- Owner Phase 2 decisions in SPEC **§28** (no code deploy):
  1. **PointMint-native verification schema** ships in Phase 2 / P2 Beta — productized UX on top of §5 L1–L3; X/TikTok/LinkedIn stay claim rails, not a substitute for membership verification. No unstated vendors invented.
  2. **Hard lock: agents cannot claim** usernames/handles, user groups, or company names. Human session only for claim / approve / bind; agents may propose or draft copy; **MCP must refuse** claim tools (`claim.refused_agent`).
  3. **First dibs:** LinkedIn group owners/admins for groups (§26); X/TikTok-verified accounts for matching handles (§27); company names via verifiable company presence (domain, LinkedIn company page admin, or similar) — human-only outline in §28.3.
- Cross-links: §5.2 → §28; §26.3 and §27.1 → human-only; §10 P2 row updated. Changelog updated. Anonymity / SHOW_FOUNDER unchanged.

## Right-column agent home (chat + mint) — LIVE (2026-10-25 ~14:05 ET, version ac30df90)
- Owner UX: the right AI agent column is where PointMint-relevant human ↔ own-agent messaging lives **at the top**; activity/posts/Markdown stay below. Unminted: **"MINT my agent"** CTA at the top; once minted, CTA removed from the column.
- Implementation: `agent_home` on `/api/page` (`src/split.js`); `agentChatHome` / `agentMintCTA` in `public-next/app.js`; poll `/api/messages?with=<agent_id>`; CSS in `split.css`. Assets `?v=19`.
- Labels: HUMAN / AI agent chips; MCP `send_message` replies appear in the same thread. No Michael/Momentum branding added.
- Deployed version **ac30df90** (credential shown in a dialog when minting from the right column).
- SPEC §29; screenshots: `screenshots/agent-home/desktop-unminted.png`, `desktop-minted-empty.png`, `desktop-minted-chat.png`, `desktop-guest.png`.

## Stacked dual-minimize (Human + FEED) — LIVE (2026-10-25 ~14:27 ET, version 08581850)
- Product: when Human column and Conversation/FEED are both minimized on desktop, both stack inside the collapsed first column (Human top ~70–80%, FEED bottom ~20–30% distinctly shaded). No floating `#fpPill` / "Network feed" pill in that view. Expand Human → glass border pop. Expand Conversation → glass panel in the center as a second element. Both expanded → Human ~80% of left column height; FEED strip bridges from the bottom ~20% into the middle column glass. Sections stay named Human / FEED · Conversation. Mobile sheet + pill unchanged.
- Files: `public-next/float.js`, `float.css`, `app.js` (`humanColumn` rail-stack + `#feedSlot`, `applyRails`→`fpApply`), `deck.css` (stack/bridge), `index.html` (`?v=20`). SPEC §24. Screenshots: `screenshots/stack-min/`.
- Deployed version **08581850** to https://agents.pointmint.io (`?v=20`). Live smoke: 29/29 stack-min checks; `/glass/michael.jpg` → 404; guest `/api/me` signed_in:false; no Michael/Momentum in HTML.
- Backup: `backup-before-stack-min-20261025/`. No matchpoint-v1 / Momentum / IAAI changes. No Michael/Momentum branding in UI or commits.
## 2026-10-25 — SPEC §30 Agent Trust Score (spec only)
- Filed bot-to-bot reputation / Agent Trust Score as **SPEC §30** in `SPEC.md` (changelog updated). No implementation yet; no matchpoint-v1 changes.
## 2026-10-25 — SPEC §32 Cardinal Rule (Michael Lebor's Ultimate Authority)
- Filed **SPEC §32** in `SPEC.md` (changelog updated). Cardinal / incontrovertible sole root of trust. Spec only for enforcement bindings; no matchpoint-v1 changes.

## 2026-10-25 — SPEC §31 Extension API (core vs extensions)
- Filed **SPEC §31** in `SPEC.md` (changelog updated): core vs extensions split; lifecycle draft → probation → graduated; trust-weighted vouch graduation (≥1000); manifest `pointmint.extension.json`; sandbox + owner veto/kill switch (§32); D1 + MCP outline. Spec only — not implemented. No matchpoint-v1 changes.
- Repo standup: root `.gitignore`, root `README.md`, git init + push to GitHub `Jekekel/pointmint` (public). Live D1 dumps stay gitignored under `backups/d1/`.

## Mel · Grok Bot micro-dashboard — LIVE (2026-10-25 ~14:40 ET, version b99245f0)
- Deployed version **b99245f0** to https://agents.pointmint.io (`?v=21`). Live checks: Mel dash for signed-in owner (Active · connected + masked cred); guests keep generic agent header; `/assets/mel.png` 200; no Momentum in HTML; `/glass/michael.jpg` 404.
- Owner UX: Mel (Grok Bot — “Ask the Grok bot”) micro-dashboard at the **very top** of the third (AI agent) column for the signed-in owner’s own agent home. Portrait, Grok Bot badge, model Grok, status, masked `pm_agent_…` credential. Guests / other members keep the generic agent header (no Mel branding).
- Mel portrait: copied from Grok Bot avatar → `public-next/assets/mel.png` (mirrored under `public/assets/`).
- Files: `public-next/app.js` (`melDash`, `grokBadge`, `maskAgentCred`), `split.css`, `index.html` (`?v=21`), `src/split.js` (`agent_home` status/provider/credential_prefix). SPEC §29 extended. Also fixed a corrupted duplicate fragment in `agentColumn` term-tail markup.
- Assets `?v=21`. No matchpoint-v1 / Momentum / IAAI changes. No Momentum branding in public UI. Secrets never echoed in full.
- Screenshots: `screenshots/mel-dash/`.

## Reciprocal Top 100 — LIVE (2026-10-25 ~14:40 ET, version 22ccfb8a)
- Product: every L1+ human maintains a **Reciprocal Top 100**; profiles show the owner's list with per-row **Reciprocated** / **Not reciprocated** (mutual badge); server LEFT JOIN for reverse edge.
- D1: migration `0014_top100_contacts.sql` (+ fictional demo seed among h_d00001…07 only).
- Worker: `src/top100.js` routes under `/api/top100/*`; `split.js` embeds `data.top100` on human pages / Markdown.
- UI: `public-next/top100.js` + `top100.css` (glass); profile section + dashboard editor; assets `?v=22`.
- SPEC §33; changelog updated. No matchpoint-v1 / Momentum / IAAI. No secrets in reports.
- Screenshots: `screenshots/reciprocal-top100/`.
- Verify: sign in → open `/h/h_d00001` → Reciprocal Top 100 shows Marcus **Reciprocated**, Priya **Not reciprocated**.


## Find-me / How-am-I-connected UX — LIVE (2026-10-25 ~14:52 ET)
- Owner: unify human↔agent identity path; How-am-I-connected multi-select popup with live graph paths; move filter search out of HUD into narrow second column; graph fills the right of that column area; AI column minimized by default in this mode; not a separate page (takes over FEED column); glass theme.
- Files (`prototype/public-next/` → synced `public/`): `index.html` (`?v=24`), `connect.js`, `connect.css`, `app.js`, `graph.js` (multi-path `showPath`), `deck.css`. Mel micro-dashboard left intact.
- Deployed version **337e5712-de71-4b87-8e21-16650c7cdd0c** to https://agents.pointmint.io (`?v=24`). Prior: 00e5c25e (path-key fix), 09e21eca (initial UX).
- Verify: HUD has no `.gsearch`/`.chips`; `/connect` sets `data-cx=on`, middle ~292px with `#gq` + chips, agent `data-r=rail` (expandable); picker multi-select lights multiple paths (`PMGraph.showPath` paths[]); human/agent → same `/h/…` + tether highlight.
- Backup: `backup-before-find-me-ux-20261025/`. No matchpoint-v1 / Momentum / IAAI. No secrets in reports.
- Screenshots: `screenshots/find-me-ux/`.
- SPEC §19.4 updated.


## Private with Mel · confidential dialogue — LIVE (2026-10-25 ~14:45 ET, version 10191c17, assets ?v=22)
- Owner ask: dedicated **internal confidential** window (Michael ↔ Mel only) for strategy/objectives/to-dos about **pointment.io** — not appointments, not the public agent-column chat (§29), not the network feed.
- Schema: `private_workspaces` + `private_workspace_messages` (`kind=private_owner_agent`, `visibility=owner_agent_only`). Migration `0015_private_workspaces.sql`.
- Worker: `src/private_workspace.js` — auth = owning human session OR that human's own agent Bearer; hard reject otherwise. Routes `GET/POST /api/private-workspace…`. MCP `private_workspace_read` / `private_workspace_send` scoped to caller only. Never joined into `messages` / activity `SHOWN` / Markdown bodies.
- UI: Mel dash **Private with Mel** button → glass panel **Private · only you & Mel** / Confidential strategy empty state (pointment.io). `public-next/app.js`, `split.css`. Assets `?v=22`.
- SPEC §35. Screenshots: `screenshots/private-workspace/`.
- Live: https://agents.pointmint.io — Worker version **10191c17**. Guest `/api/private-workspace` → 401; privacy smoke 21/21 (own agent MCP read OK; other agent + `list_messages` + activity feed cannot see private body).
- How to open: sign in → Mel micro-dashboard (AI column) → **Private with Mel**.
- Screenshots: `screenshots/private-workspace/` (`desktop-guest.png`, `desktop-mel-dash-entry.png`, `desktop-private-open.png`, `desktop-private-thread.png`, `mobile-private-open.png`).
- No matchpoint-v1 / Momentum / IAAI changes. No secrets in reports.


## Agent-to-agent relay / broker — SPEC FILED (2026-10-25 ~14:45 ET)
- SPEC §34 (Calendly shelved; slot reused): relay/broker via Worker MCP, two-sided consent + autonomy, one-bot-per-human, audit/rate limits, envelope format, discovery, MCP for outside agents, off-platform onboarding (OAuth / pairing code / JSON packet, poll or webhook), federation later.
- **Not implemented.** No code, no matchpoint-v1 changes.

## Message & sensitive-data encryption — SPEC FILED (2026-10-25 ~14:48 ET)
- SPEC §36: TLS 1.2+ in transit; app-level encryption before D1 write; per-human DEK wrapped by human-controlled KEK (passkey/WebAuthn, human-held escrow); scope §35 threads, Calendly data, vault, §34 relay bodies; agents unwrap only as that human's agent via MCP; no plaintext logs. Cross-ref added in §32.3. Changelog updated.
- **Not implemented.** No code, no matchpoint-v1 changes.

## Guiding principle: vault first — SPEC FILED (2026-10-25 ~14:56 ET)
- SPEC §0 "Guiding principle: The vault is the main course" inserted after the one-line, before §1. Vault (buy/sell/seek/acquire) is the main course; graph, six degrees, intros, community secondary; viewer-lens overlap Venn always visible on profiles; feeding the vault sharpens the agent at solving for X; all content/outreach distills to buy/sell; motivation always on. No renumbering. Changelog updated.
- **Not implemented.** No code, no matchpoint-v1 changes.
- 2026-10-25: Draft ambassador outreach brief at docs/ambassador-brief-draft.md (HELD, not executed).
