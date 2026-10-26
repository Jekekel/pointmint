# SHELVED — do not implement yet

Michael shelved 2026-10-25. Revisit later. Not part of live SPEC.

## 34. Gated Calendly scheduling ("Schedule with filter")

**Status:** Spec only — not implemented. No matchpoint-v1 changes.

### 34.1 Purpose
Calendar appointments are a **core platform communication outcome**. Every profile can hold a Calendly link, but the URL is **never directly exposed**. A requester (human or bot) must answer a free-form question; AI (platform and/or the owner's agent) evaluates the answer and releases the link only if it passes. Goal: keep low-quality requests from filling the owner's day. Works in **both directions** (inbound and outbound on the owner's behalf).

### 34.2 Public surface vs private fields
- **Public:** "Has calendar · willing to schedule" indicator (glass pill on profile/graph node) + "Request a time" button. Optionally the owner's filter question text.
- **Private (owner + owner's agent only):** Calendly URL (encrypted at rest), release policy, eval thresholds, request history.
- The raw URL never appears in public HTML, Markdown/JSON human pages, graph payloads, feed posts, or search indexes.

### 34.3 Placement (glass theme)
- Profile edit section "Scheduling" — add/replace link, toggle visibility mode: `off` | `indicator` (hidden link, release after filter; default when a link exists).
- Mel dash (third column) — compact card: pending requests count, approve/deny, edit filter question.
- Private strategy window — optional later mention only.
- All surfaces use existing glass panels (`split.css` tokens); no new theme.

### 34.4 Data model (D1)
`calendar_links`
- `human_id` PK → humans.id
- `calendly_url_encrypted` (AES-GCM, key in Worker secret; never logged)
- `calendar_enabled` bool, `visibility` (`off`|`indicator`)
- `release_policy` (`agent_auto` | `owner_review` | `agent_then_owner`), `auto_approve_min_score` (0–100, default 70), `bot_min_score` (default 80)
- `filter_prompt` (owner-customizable; default below), `release_ttl_hours` (default 72)
- `created_at`, `updated_at`

`calendar_access_requests`
- `id`, `direction` (`inbound`|`outbound`)
- `requester_human_id` nullable, `requester_agent_id` nullable (one required)
- `target_human_id`
- `answer_text` (≤1,000 chars), `filter_prompt_snapshot`
- `eval_status` (`pending`|`approved`|`denied`|`needs_owner`|`expired`|`revoked`), `eval_score`, `eval_reason`
- `decided_by` (`agent`|`owner`|`system`), `decided_at`
- `released_at`, `expires_at`, `release_token_hash` (single-use view token)
- `created_at`

`calendar_audit_log` — `id`, `request_id`, `actor` (human/agent/system id), `action` (create, eval, approve, deny, release_view, revoke, link_update), `meta_json`, `created_at`. No URL in meta.

Default filter prompt: *"In a few sentences: why do you want to meet, what's in it for both of us, and what would a great outcome of this call be?"*

### 34.5 Inbound gating flow
1. Requester sees indicator → clicks "Request a time" (or bot calls `request_calendar_access`).
2. Shown the owner's `filter_prompt`; submits free-form answer.
3. Rate limits checked (see 34.6); row created `pending`.
4. Platform AI evaluates → score + reason; owner's agent may apply policy.
5. Per `release_policy`: auto-approve ≥ threshold, auto-deny clear spam, else `needs_owner` (Mel dash notification).
6. On approve: issue single-use, expiring release token; requester redeems it via authenticated endpoint/MCP to get the URL **privately** (DM/response body only, never feed).
7. Expiry or owner revoke → token invalid; audit logged throughout.

### 34.6 Free-form Q + AI evaluation
- Criteria: relevance to owner's profile/stated interests, mutual value, specificity/effort, spam/abuse/sales-blast signals, requester trust (Agent Trust Score §30, verification level), prior history with owner.
- Bots face higher bar (`bot_min_score`) by default.
- Rate limits: per requester → per target 1 open request, 3/30 days; per requester global 20/day; per target daily cap configurable.
- Owner's agent may auto-approve/deny **within** policy; owner can override any decision any time (Cardinal Rule §32 applies to Michael).
- Never auto-post the raw URL to feed, comments, or public threads. Eval prompt treats answer text as untrusted (prompt-injection safe).

### 34.7 Outbound direction (agent books on owner's behalf)
- Michael's agent calls `request_calendar_access` against a counterpart with `direction=outbound`, auto-drafting the answer from Michael's goals (Michael can review before submit per his policy).
- Counterpart's same filter/policy evaluates; or counterpart approves manually.
- On release, Michael's agent receives the URL privately and uses it to pick a time (v1: agent opens Calendly link via browser/hand-off to Michael; checks Michael's calendar for conflicts).
- Only works for counterparts who enabled gated release (or approve ad hoc).
- v2: Calendly OAuth/API booking & embed.

### 34.8 MCP tools
- `list_calendar_indicator(human_id)` → `{has_calendar, willing, filter_prompt}` — no URL.
- `request_calendar_access(target_human_id, answer_text, direction)` → `request_id, status`.
- `get_calendar_access_status(request_id)` → status/reason; returns URL **only** if approved, unexpired, and caller is the requester.
- `respond_calendar_access(request_id, approve|deny, reason)` — target owner/agent only.
- `list_calendar_requests(inbound|outbound, status)` — own only.
- `get_own_calendar_link` / `set_own_calendar_link` — own agent, own link only.
- No tool returns another member's raw URL without a granted request id.

### 34.9 Architecture
- Cloudflare Worker routes `/api/calendar/*`; D1 tables above (new migration); R2 optional (none needed v1).
- Encryption key as Worker secret; decrypt only at redeem/own-read time.
- `split.js` human pages / graph emit only the indicator.
- AI eval via platform model call in Worker (or owner's agent via extension API §31); store score/reason only.

### 34.10 Non-goals / phases
- v1: gated URL release, eval, MCP, dashboard approve/deny.
- v2: Calendly OAuth, embedded booking, auto-book, Google Calendar sync.
- Not in scope: matchpoint-v1, payments for meetings, non-Calendly providers (later: Cal.com, Google appointment pages).

### 34.11 Open questions
- Final default filter question wording.
- Should bot requesters always require owner review, or just higher threshold?
- Release expiry default (72h?) and single-use vs multi-view.
- Show filter question publicly before click, or only after?
- Notify denied requesters with reason, or generic decline?

### 34.12 Per-person AI learning loop (added 2026-10-25 — still shelved)

**Goal:** The calendar gate learns each human's accept/reject taste over time so the owner's agent can auto-release (or auto-deny) without the human reviewing every request. Learning is **individual per `human_id`** — never pooled across members into a shared "global taste" model that leaks one person's preferences into another's decisions.

**Signals (per owner):**
1. Labeled outcomes on `calendar_access_requests`: approve/deny, `decided_by`, score, reason, requester verification level / Trust Score, answer text, graph distance, shared entities, industry/title features when known.
2. Optional light polls after a decision (rate-limited, skippable): *"Why did you say yes?"* / *"Why did you say no?"* with short free-text or chips (e.g. seniority, industry, mutual intro, tone, timing, spam). Stored as `calendar_decision_feedback` (`request_id`, `human_id`, `chips_json`, `note`, `created_at`).
3. Implicit criteria surfacing: after a meaningful sample (e.g. ~10 accepts and ~10 denies, or N total decisions), run an offline/batch summarizer that produces a private **taste profile** for that human only — e.g. prefers VP+, healthcare/insurtech, path ≤2 hops, concrete mutual value; rejects cold SDR blasts, vague "pick your brain," no mutual context.

**Data (draft):**
- `calendar_taste_profiles` — `human_id` PK, `summary_md` (private, owner+own agent), `features_json` (weights/tags), `sample_n_accept`, `sample_n_deny`, `model_version`, `updated_at`
- `calendar_decision_feedback` — as above
- Never expose taste profiles on public profile, feed, or other agents' MCP.

**Recursive loop:**
1. Eval step (34.6) loads the owner's current taste profile as prior features + the live filter answer.
2. Decision written → outcome joins the training set for that owner only.
3. Periodic retrain/summarize updates `calendar_taste_profiles` (and can tighten or loosen `auto_approve_min_score` suggestions; owner must confirm policy changes).
4. Predictions improve; confidence gates auto-action: low confidence → `needs_owner`; high confidence + policy `agent_auto` → auto approve/deny.
5. Human overrides always win and become strong supervised labels (Cardinal Rule for Michael).

**Privacy / safety:**
- Taste data is owner-private; other bots cannot read it via MCP.
- No cross-member training that reveals who A accepts to B.
- Polls are opt-in / infrequent; never block the approve/deny UI.
- Prompt-injection: treat requester answers and poll text as untrusted.

**Open questions (learning):** minimum N before auto-trusting the profile; whether chips-only polls beat free text; how long feedback is retained; whether taste summary is editable by the owner in plain language.
