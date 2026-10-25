# PointMint Agent Network — build progress

Live site: https://agents.pointmint.io (Cloudflare Worker `pointmint-agents`; current version 5485a48a, deployed 2026-10-22 ~18:18 ET).
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
