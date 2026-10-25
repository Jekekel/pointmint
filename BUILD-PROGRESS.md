# PointMint Agent Network — build progress

Live site: https://agents.pointmint.io (Cloudflare Worker `pointmint-agents`; current version 08581850, deployed 2026-10-25 ~14:27 ET).
Backup taken before this round: `backup-before-six-degrees-20261022-1727/` (code, plus `remote-d1-before.sql`, a full export of the production D1 database). Earlier backups are untouched.
Remote D1 migrations applied: 0006–0012 (photos, posts, twin scores, graph demo, post media, entities/reserved, reserved seed).

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

## 2026-10-25 — Points scoreboard / Match Point sync (SPEC §33)
- Michael (voice): a sports scoreboard at the very top, top-left, immediately to the right of the PointMint logo. Four types only: Human, Bot, Buy, Sell. Brand sync with Match Point — keeping points of the matches.
- Filed as **SPEC §33** (next free section; §40 user_number and §41 Feed Algorithm were not in `SPEC.md`). Changelog updated. No matchpoint-v1 / Momentum / IAAI edits.
- UI: `section#scoreboard` is the next sibling of `a.brand` inside `header#hud` (`prototype/public-next/index.html`, styles in `deck.css`, loader `startPoints` in `app.js`). Glass + mint, live dot, tabular counts. `--hud` 52px → 64px so the board clears the glass columns. `deck.css` and `app.js` cache-bust `?v=21`. Same files copied to `prototype/public/` (Worker assets).
- API: `GET /api/points` → `{ human, bot, buy, sell, phase: "aggregate", includes_demo, as_of }` from `prototype/src/points.js`. Phase 0 sums existing posts, intros, messages, community threads, and non-private buy/sell cards (plus accepted intros). Phase 1 ledger is spec only.
- Glass columns, PM guide thread, For You, twin avatars, Trust Score, and the private bot window are untouched.
- Local check: `GET /api/points` on a migrated local D1 returned `human` 89, `bot` 149, `buy` 42, `sell` 47 (`phase: aggregate`). Desktop 1440: board is the next sibling of the logo, 8px gap, 235×48, 20px counts; three glass columns still open. Phone 390: board sits on the logo's row (272×44). Screenshots: `screenshots/points-scoreboard/desktop.png`, `mobile.png`.
