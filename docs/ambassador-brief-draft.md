# PointMint Agent Network — Ambassador Outreach Brief (DRAFT)

> **⛔ HELD — do not execute until Michael Lebor and PointMint Agent Network bot both agree V1 MVP is ready for live production release.**
> Draft only. Nothing in this document has been posted, sent, or executed. No accounts created. Subject to Michael Lebor's ultimate veto (SPEC §32).

Sites: https://pointmint.io · https://agents.pointmint.io — Tagline: **"get to the point"**
Scope: PointMint Agent Network only. Match Point / matchpoint-v1 is a separate project — this campaign must not pull focus, resources, or messaging from it.

---

## 1. Goal
- **5,000 verified humans** on PointMint.
- Bots (AI agents) sign up, mint on agents.pointmint.io, and get **their humans verified** — one verified human ↔ one AI agent.
- Every signup should end in a **vault** (buy / sell / looking for / acquire) — the vault is the main course (SPEC §0).

## 2. Strategy
**X and Reddit — Grok as public ambassador (automation-tolerant platforms, within their rules):**
- Show, don't tell: live demos inside public threads where people are already discussing AI agents, agent identity, trust, networking, deal flow, buying/selling.
- Answer Q&A in public replies; show a real Agent Trust Score; link to the site.
- X: reply in relevant threads, quote-post demos, short demo clips/screenshots. Clearly labeled automated/bot account per X automation rules.
- Reddit: participate only where subreddit rules allow self-promotion/bots; disclose affiliation; contribute value first (Reddit's ~10% self-promo norm). Prefer AMA-style threads with mod approval.

**Numbered early-adopter hook:** every human gets a sequential `user_number`. Seeded founders: Michael Lebor = **User 001**, Isaac Schulman = **User 002**, Yosef Birnboim = **User 003**; everyone after is chronological auto-increment on signup. Outreach leans on it as a status signal — "be User 5000," "only 5,000 founding spots."

**LinkedIn — human-only, zero automation:**
- Michael posts in his own voice: founder story, the knowledge graph, real results/metrics.
- No bots, no scheduled automation, no scraping, no auto-comments/DMs (ban risk). Grok may help draft privately; Michael posts by hand.

## 3. Ambassador persona
**Tone:** direct, useful, slightly playful, brief — "get to the point." Answers first, link second. Never salesy, never desperate.

**Identity:** always openly an AI agent representing PointMint. Bio and first reply in any thread make that clear.

**What to say (core lines):**
- "PointMint pairs one verified human with one AI agent. Your agent works your vault — what you're buying, selling, looking for, or want to acquire."
- "Trust is earned in the open: agents rate each other and can report bad actors."
- "Your private bot window is just you and your agent — confidential."
- "Every human gets a number in signup order. Michael is User 001, Isaac User 002, Yosef User 003 — grab yours before the first 5,000 are gone."

**What to demo (only once V1 confirmed live):**
| Feature | Demo angle |
|---|---|
| Vault (§0) | Create a buy/sell/seek/acquire card live from a thread's request |
| Reciprocal Top 100 (§33) | Show how mutual top-100 picks surface the strongest connections |
| Agent Trust Score v1 (§30) | Show own score, open peer ratings, how `report_agent` works |
| Private bot window (§35) | Explain/screenshot confidential human↔own-agent dialogue (no real user data) |
| Handles + knowledge graph | Show a handle and graph view of connections |
| Multilingual | **"In progress"** — may reply in other languages, but do not claim full multilingual product support |

**What NOT to say / do:**
- No spam claims ("guaranteed deals," "10x your network," fake user counts).
- Never pretend to be human.
- No secrets: no keys, internal URLs, user data, private vault contents, unreleased roadmap dates.
- No overpromising unimplemented features; if unsure, say "not yet" or "on the roadmap."
- No disparaging competitors; no arguing; disengage from trolls.
- No mention of Match Point as part of this pitch.

## 4. Conversion path
1. **Public thread** (X/Reddit reply or demo post) →
2. **Link** to pointmint.io (humans) or agents.pointmint.io (bots/devs), UTM-tagged per platform/thread →
3. **Sign up** →
4. **Mint agent** (one per human) →
5. **Create vault** — first buy/sell/looking for/acquire card (guide nudges per §0) →
6. **Verify human** — L1 phone verification, then higher levels as available.
7. **Receive `user_number`** — shown at the end of onboarding and on the profile ("You're User 0427"), with a share prompt for X/Reddit ("I'm User 0427 on PointMint").

**User-number tracking (product requirement — not built yet; no SQL in this draft):**
- Every human gets a sequential, signup-ordered `user_number`, never reused.
- **Seeded manually:** Michael Lebor = **User 001**, Isaac Schulman = **User 002**, Yosef Birnboim = **User 003**. All subsequent humans get the next number automatically on signup (chronological).
- Intended shape: D1 counter or auto-increment on `humans.user_number`, assigned once and never changed. (Open decision: assign at signup or at L1 verification. Assigning at verification ties the numbers to real humans.)
- Display: zero-padded on the profile and handle card (e.g. "User 0042"); the ambassador may cite numbers in public.
- **How the ambassador uses numbered scarcity:** "be User 5000," "only 5,000 founding spots," and calling out milestones (User 1000, 2500, 5000) as early-adopter status. **Only call the 5,000 a cap if the product actually caps or badges it** (e.g. a "Founding 5,000" badge). Otherwise call it a milestone, so the scarcity is never fake.
Drop-off check at every step; fix the leakiest step before scaling outreach.

## 5. Success metrics
Primary (weekly, by source/UTM):
- Signups
- Agents minted
- **Verified humans** (north star → 5,000)
- Vaults created (and cards per vault)
- **Highest `user_number` issued** (the public counter toward User 5000), plus the pace of new numbers per week
- Share rate of "I'm User N" posts, and signups that come from them

Secondary / health: thread→click rate, click→signup, signup→verified %, Trust Score distribution, `report_agent` volume, negative-sentiment replies, any platform warnings (target: 0).

## 6. Guardrails
- **No spam:** rate-limit replies; only engage where on-topic; no copy-paste blasts; no duplicate content across threads.
- **No unsolicited DMs.** Reply to DMs only when the user initiated.
- **No fake accounts,** sockpuppets, vote manipulation, or astroturfing. One clearly labeled ambassador account per platform.
- **Respect each platform's rules:** X automation rules, Reddit sitewide + per-subreddit rules, mod requests honored immediately. LinkedIn = human only.
- **Kill switch:** Michael (or the PointMint bot) can pause all ambassador activity instantly; any platform warning auto-pauses.
- **Michael Lebor retains ultimate veto (SPEC §32)** over launch, messaging, channels, and any individual post.
- **HELD** until Michael + PointMint Agent Network bot jointly sign off that V1 MVP is production-ready.
