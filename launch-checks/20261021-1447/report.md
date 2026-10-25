# Launch check — NO-GO

- **Site:** https://agents.pointmint.io
- **Started:** 10/21/2026, 2:47:51 PM ET
- **Runtime:** 4m 21s
- **Totals:** 272 passed · 11 failed · 16 warnings · 4 notes

## Verdict: NO-GO ❌

### Blockers (must fix before launch)

- **[4 Labels] /: every human labeled "Verified human"/"Human"** — 17 human elements; unlabeled: a[/h/h_d00008] "Ben Hartley (Demo)", a[/h/h_d00007] "Sofia Alvarez (Demo)"
- **[4 Labels] /vault: every human labeled "Verified human"/"Human"** — 20 human elements; unlabeled: a[/h/h_d00008] "Ben Hartley (Demo)", a[/h/h_d00007] "Sofia Alvarez (Demo)", a[/h/h_d00006] "Jamal Wright (Demo)", a[/h/h_d00005] "Elena Petrova (Demo)", a[/h/h_d00004] "Tom Okafor (Demo)"
- **[6 Accessibility] /: axe-core — no serious/critical violations** — serious: link-in-text-block (2× e.g. .vitem:nth-child(3) > .body > .vfoot > span:nth-child(2) > a[href="/h/h_d00008"][data-link=""]) | minor/moderate: region×1
- **[6 Accessibility] /network: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1
- **[6 Accessibility] /vault: axe-core — no serious/critical violations** — serious: color-contrast (4× e.g. label[for="ty-buy"]); serious: link-in-text-block (5× e.g. article:nth-child(1) > .body > .vfoot > span:nth-child(2) > a[href="/h/h_d00008"][data-link=""]) | minor/moderate: heading-order×1, region×1
- **[6 Accessibility] /intros: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1
- **[6 Accessibility] /about: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1
- **[6 Accessibility] /docs: axe-core — no serious/critical violations** — serious: link-in-text-block (2× e.g. li:nth-child(1) > a[href$="signup"][data-link=""]); serious: scrollable-region-focusable (1× e.g. pre:nth-child(14)) | minor/moderate: region×1
- **[6 Accessibility] /signup: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1
- **[6 Accessibility] /a/agent_d00001: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1
- **[6 Accessibility] /h/h_d00001: axe-core — no serious/critical violations** — serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) | minor/moderate: region×1

### Warnings (worth fixing, not blocking)

- [8 SEO/share] Canonical link — missing
- [8 SEO/share] og:title tag — missing
- [8 SEO/share] og:description tag — missing
- [8 SEO/share] og:image tag — missing
- [8 SEO/share] twitter:card tag — missing
- [8 SEO/share] twitter:image tag — missing
- [8 SEO/share] robots.txt — missing (HTTP 200, text/html — SPA fallback page, not a robots file)
- [8 SEO/share] sitemap.xml — not present (optional)
- [5 Visual] /: layout shift (CLS) desktop — CLS 0.182
- [6 Accessibility] /vault: heading order — 1 h1; sequence 1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3; skips h1→h3
- [5 Visual] /vault: layout shift (CLS) desktop — CLS 0.167
- [5 Visual] /docs: layout shift (CLS) desktop — CLS 0.182
- [6 Accessibility] /signup: focus is visible on interactive elements — 12 tested; no visible focus: input ""
- [5 Visual] /h/h_d00001: layout shift (CLS) desktop — CLS 0.167
- [5 Visual] /intros: layout shift (CLS) mobile — CLS 0.220
- [7 Performance] Lighthouse mobile: Performance — score 88

### Notes

- [1 Routes] Unknown pages return HTTP 200 (soft 404 from SPA fallback) — Search engines may index junk URLs; consider returning 404 status for unknown routes later
- [7 Performance] Lighthouse key metrics (mobile, simulated slow 4G) — FCP 1.6 s, LCP 1.6 s, TBT 0 ms, CLS 0.226, Speed Index 1.6 s; total weight Total size was 35 KiB
- [7 Performance] Lighthouse opportunities — Cumulative Layout Shift; Browser errors were logged to the console; Avoid large layout shifts; Links rely on color to be distinguishable.; Issues were logged in the `Issues` panel in Chrome Devtools; robots.txt is not valid; Layout shift culprits; Forced reflow
- [3 Console] Cloudflare Web Analytics beacon blocked by CSP (known, ignored) — 96 occurrences of static.cloudflareinsights.com being refused by script-src 'self'. Harmless; analytics just isn't collected. Allow the host in CSP or turn off the beacon if analytics is wanted.

## All checks

| Result | Area | Check | Detail |
|---|---|---|---|
| ✅ PASS | 1 Routes | GET / returns 200 | HTTP 200 in 90 ms |
| ✅ PASS | 1 Routes | GET /network returns 200 | HTTP 200 in 52 ms |
| ✅ PASS | 1 Routes | GET /vault returns 200 | HTTP 200 in 46 ms |
| ✅ PASS | 1 Routes | GET /intros returns 200 | HTTP 200 in 28 ms |
| ✅ PASS | 1 Routes | GET /about returns 200 | HTTP 200 in 33 ms |
| ✅ PASS | 1 Routes | GET /docs returns 200 | HTTP 200 in 30 ms |
| ✅ PASS | 1 Routes | GET /signup returns 200 | HTTP 200 in 51 ms |
| ✅ PASS | 1 Routes | GET /a/agent_d00001 returns 200 | HTTP 200 in 42 ms |
| ✅ PASS | 1 Routes | GET /h/h_d00001 returns 200 | HTTP 200 in 45 ms |
| ✅ PASS | 1 Routes | API /api/health returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | API /api/network returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | API /api/showcase/intros returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | API /api/humans/h_d00001 returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | API /api/agents/agent_d00001 returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | API /api/vault/browse returns 200 | HTTP 200 |
| ✅ PASS | 1 Routes | Unknown API path returns a clean 404 | HTTP 404 |
| ✅ PASS | 9 Security | Homepage: Content-Security-Policy | default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; obje |
| ✅ PASS | 9 Security | Homepage: HSTS | max-age=31536000; includeSubDomains |
| ✅ PASS | 9 Security | Homepage: X-Frame-Options | DENY |
| ✅ PASS | 9 Security | Homepage: X-Content-Type-Options nosniff | nosniff |
| ✅ PASS | 9 Security | Homepage: Referrer-Policy | strict-origin-when-cross-origin |
| ✅ PASS | 9 Security | API: Content-Security-Policy | default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; obje |
| ✅ PASS | 9 Security | API: HSTS | max-age=31536000; includeSubDomains |
| ✅ PASS | 9 Security | API: X-Frame-Options | DENY |
| ✅ PASS | 9 Security | API: X-Content-Type-Options nosniff | nosniff |
| ✅ PASS | 9 Security | API: Referrer-Policy | strict-origin-when-cross-origin |
| ✅ PASS | 8 SEO/share | Page <title> | PointMint Agent Network |
| ✅ PASS | 8 SEO/share | Meta description | 115 chars |
| ⚠️ WARN | 8 SEO/share | Canonical link | missing |
| ⚠️ WARN | 8 SEO/share | og:title tag | missing |
| ⚠️ WARN | 8 SEO/share | og:description tag | missing |
| ⚠️ WARN | 8 SEO/share | og:image tag | missing |
| ⚠️ WARN | 8 SEO/share | twitter:card tag | missing |
| ⚠️ WARN | 8 SEO/share | twitter:image tag | missing |
| ✅ PASS | 8 SEO/share | Favicon reachable | /favicon.svg HTTP 200 image/svg+xml |
| ⚠️ WARN | 8 SEO/share | robots.txt | missing (HTTP 200, text/html — SPA fallback page, not a robots file) |
| ⚠️ WARN | 8 SEO/share | sitemap.xml | not present (optional) |
| ✅ PASS | 4 Labels | API: every member is a "Verified human" and every agent an "AI agent" | 8 members |
| ✅ PASS | 10 Functional | e2e.mjs (sign-up, one-agent rule, vault, MCP tools, intros, audit, rotate/revoke, rate limits) | 48 passed, 0 failed in 16s |
| ✅ PASS | 11 MCP | /mcp without a token is rejected with 401 | HTTP 401 |
| ✅ PASS | 11 MCP | /mcp with a bogus token is rejected with 401 | HTTP 401 |
| ✅ PASS | 9 Security | Sign-in cookie flags (__Host-, HttpOnly, Secure, SameSite, Path=/) | __Host-pm_session=<redacted>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800 |
| ✅ PASS | 11 MCP | initialize works with a fresh credential | protocol 2025-06-18, server pointmint-agent-network |
| ✅ PASS | 11 MCP | tools/list works | 7 tools: get_my_profile, get_my_vault, add_vault_item, search_matches, propose_intro, list_intros, send_message |
| ✅ PASS | 11 MCP | Credential rejected after revoke | HTTP 401 |
| ✅ PASS | 1 Routes | / renders in a real browser | HTTP 200, title "PointMint Agent Network" |
| ✅ PASS | 4 Labels | /: every AI agent element labeled "AI agent" | 15 agent elements |
| ❌ FAIL | 4 Labels | /: every human labeled "Verified human"/"Human" | 17 human elements; unlabeled: a[/h/h_d00008] "Ben Hartley (Demo)", a[/h/h_d00007] "Sofia Alvarez (Demo)" |
| ✅ PASS | 4 Labels | /: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /: no console errors | clean |
| ✅ PASS | 3 Console | /: no failed requests | clean |
| ✅ PASS | 2 Assets | /: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /: heading order | 1 h1; sequence 1,2,3,3,3,3,2,3,3,3,3,2,3,3,3,2,2,2 |
| ✅ PASS | 6 Accessibility | /: focus is visible on interactive elements | 12 tested |
| ⚠️ WARN | 5 Visual | /: layout shift (CLS) desktop | CLS 0.182 |
| ✅ PASS | 1 Routes | /network renders in a real browser | HTTP 200, title "Network · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /network: every AI agent element labeled "AI agent" | 16 agent elements |
| ✅ PASS | 4 Labels | /network: every human labeled "Verified human"/"Human" | 16 human elements |
| ✅ PASS | 4 Labels | /network: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /network: no console errors | clean |
| ✅ PASS | 3 Console | /network: no failed requests | clean |
| ✅ PASS | 2 Assets | /network: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /network: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /network: heading order | 1 h1; sequence 1 |
| ✅ PASS | 6 Accessibility | /network: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /network: layout shift (CLS) desktop | CLS 0.078 |
| ✅ PASS | 1 Routes | /vault renders in a real browser | HTTP 200, title "Vault · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /vault: every AI agent element labeled "AI agent" | 0 agent elements |
| ❌ FAIL | 4 Labels | /vault: every human labeled "Verified human"/"Human" | 20 human elements; unlabeled: a[/h/h_d00008] "Ben Hartley (Demo)", a[/h/h_d00007] "Sofia Alvarez (Demo)", a[/h/h_d00006] "Jamal Wright (Demo)", a[/h/h_d00005] "Elena Petrova (Demo)", a[/h/h_d00004] "Tom Okafor (Demo)" |
| ✅ PASS | 4 Labels | /vault: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /vault: no console errors | clean |
| ✅ PASS | 3 Console | /vault: no failed requests | clean |
| ✅ PASS | 2 Assets | /vault: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /vault: images have alt text | 0 <img> |
| ⚠️ WARN | 6 Accessibility | /vault: heading order | 1 h1; sequence 1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3; skips h1→h3 |
| ✅ PASS | 6 Accessibility | /vault: focus is visible on interactive elements | 12 tested |
| ⚠️ WARN | 5 Visual | /vault: layout shift (CLS) desktop | CLS 0.167 |
| ✅ PASS | 1 Routes | /intros renders in a real browser | HTTP 200, title "Intros · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros: every AI agent element labeled "AI agent" | 12 agent elements |
| ✅ PASS | 4 Labels | /intros: every human labeled "Verified human"/"Human" | 12 human elements |
| ✅ PASS | 4 Labels | /intros: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros: no console errors | clean |
| ✅ PASS | 3 Console | /intros: no failed requests | clean |
| ✅ PASS | 2 Assets | /intros: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /intros: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /intros: heading order | 1 h1; sequence 1,2 |
| ✅ PASS | 6 Accessibility | /intros: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /intros: layout shift (CLS) desktop | CLS 0.100 |
| ✅ PASS | 1 Routes | /about renders in a real browser | HTTP 200, title "How it works · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /about: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /about: every human labeled "Verified human"/"Human" | 0 human elements |
| ✅ PASS | 4 Labels | /about: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /about: no console errors | clean |
| ✅ PASS | 3 Console | /about: no failed requests | clean |
| ✅ PASS | 2 Assets | /about: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /about: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /about: heading order | 1 h1; sequence 1,2,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /about: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /about: layout shift (CLS) desktop | CLS 0.099 |
| ✅ PASS | 1 Routes | /docs renders in a real browser | HTTP 200, title "Developers · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /docs: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /docs: every human labeled "Verified human"/"Human" | 0 human elements |
| ✅ PASS | 4 Labels | /docs: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /docs: no console errors | clean |
| ✅ PASS | 3 Console | /docs: no failed requests | clean |
| ✅ PASS | 2 Assets | /docs: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /docs: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /docs: heading order | 1 h1; sequence 1,2,2,3,3,2,2 |
| ✅ PASS | 6 Accessibility | /docs: focus is visible on interactive elements | 12 tested |
| ⚠️ WARN | 5 Visual | /docs: layout shift (CLS) desktop | CLS 0.182 |
| ✅ PASS | 1 Routes | /signup renders in a real browser | HTTP 200, title "Sign in · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /signup: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /signup: every human labeled "Verified human"/"Human" | 0 human elements |
| ✅ PASS | 4 Labels | /signup: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /signup: no console errors | clean |
| ✅ PASS | 3 Console | /signup: no failed requests | clean |
| ✅ PASS | 2 Assets | /signup: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /signup: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /signup: heading order | 1 h1; sequence 1 |
| ⚠️ WARN | 6 Accessibility | /signup: focus is visible on interactive elements | 12 tested; no visible focus: input "" |
| ✅ PASS | 5 Visual | /signup: layout shift (CLS) desktop | CLS 0.009 |
| ✅ PASS | 1 Routes | /a/agent_d00001 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00001: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /a/agent_d00001: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: heading order | 1 h1; sequence 1,2 |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /a/agent_d00001: layout shift (CLS) desktop | CLS 0.025 |
| ✅ PASS | 1 Routes | /h/h_d00001 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00001: every AI agent element labeled "AI agent" | 10 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00001: every human labeled "Verified human"/"Human" | 9 human elements |
| ✅ PASS | 4 Labels | /h/h_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /h/h_d00001: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: heading order | 1 h1; sequence 1,2,2,3,3,3,2 |
| ✅ PASS | 6 Accessibility | /h/h_d00001: focus is visible on interactive elements | 12 tested |
| ⚠️ WARN | 5 Visual | /h/h_d00001: layout shift (CLS) desktop | CLS 0.167 |
| ✅ PASS | 1 Routes | /h/h_d00006 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00006: every AI agent element labeled "AI agent" | 10 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00006: every human labeled "Verified human"/"Human" | 9 human elements |
| ✅ PASS | 4 Labels | /h/h_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00006: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00008 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00008: every AI agent element labeled "AI agent" | 5 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00008: every human labeled "Verified human"/"Human" | 4 human elements |
| ✅ PASS | 4 Labels | /h/h_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00007 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00007: every AI agent element labeled "AI agent" | 9 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00007: every human labeled "Verified human"/"Human" | 8 human elements |
| ✅ PASS | 4 Labels | /h/h_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00002 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00002: every AI agent element labeled "AI agent" | 7 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00002: every human labeled "Verified human"/"Human" | 6 human elements |
| ✅ PASS | 4 Labels | /h/h_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00002 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00002: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00001 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every AI agent element labeled "AI agent" | 5 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every human labeled "Verified human"/"Human" | 5 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00001: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00003 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00003: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00003 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00003: every AI agent element labeled "AI agent" | 10 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00003: every human labeled "Verified human"/"Human" | 9 human elements |
| ✅ PASS | 4 Labels | /h/h_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00004 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00004: every AI agent element labeled "AI agent" | 9 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00004: every human labeled "Verified human"/"Human" | 8 human elements |
| ✅ PASS | 4 Labels | /h/h_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00004 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00004: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00004: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00002 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00002: every AI agent element labeled "AI agent" | 3 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00002: every human labeled "Verified human"/"Human" | 3 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00005 renders in a real browser | HTTP 200, title "Member · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00005: every AI agent element labeled "AI agent" | 7 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00005: every human labeled "Verified human"/"Human" | 6 human elements |
| ✅ PASS | 4 Labels | /h/h_d00005: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00005: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00005: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00005 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00005: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00005: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00005: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00005: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00005: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00003 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00003: every AI agent element labeled "AI agent" | 3 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00003: every human labeled "Verified human"/"Human" | 3 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00007 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00007: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00008 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00008: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00004 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every AI agent element labeled "AI agent" | 4 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every human labeled "Verified human"/"Human" | 4 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00006 renders in a real browser | HTTP 200, title "AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00006: every AI agent element labeled "AI agent" | 1 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: every human labeled "Verified human"/"Human" | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00006: no failed requests | clean |
| ✅ PASS | 2 Assets | All internal links and assets return 2xx | 30 internal URLs checked across 27 pages |
| ✅ PASS | 2 Assets | External links reachable | 2 external URLs |
| ✅ PASS | 2 Assets | Media weight (images ≤ 2 MB, videos ≤ 8 MB) | 1 media files; landing page media total 0.00 MB |
| ✅ PASS | 5 Visual | /: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /network: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /network: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /vault: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /vault: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /intros: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ⚠️ WARN | 5 Visual | /intros: layout shift (CLS) mobile | CLS 0.220 |
| ✅ PASS | 5 Visual | /about: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /about: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /docs: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /docs: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /signup: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /signup: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /a/agent_d00001: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /a/agent_d00001: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /h/h_d00001: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /h/h_d00001: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /network: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /vault: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /intros: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /about: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /docs: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /signup: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /a/agent_d00001: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 5 Visual | /h/h_d00001: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.96 |
| ✅ PASS | 1 Routes | 404 page is sane (no 5xx, shows "not found", has a way home, keeps nav + disclaimer) | HTTP 200; "not found" shown true |
| ❌ FAIL | 6 Accessibility | /: axe-core — no serious/critical violations | serious: link-in-text-block (2× e.g. .vitem:nth-child(3) > .body > .vfoot > span:nth-child(2) > a[href="/h/h_d00008"][data-link=""]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /network: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /vault: axe-core — no serious/critical violations | serious: color-contrast (4× e.g. label[for="ty-buy"]); serious: link-in-text-block (5× e.g. article:nth-child(1) > .body > .vfoot > span:nth-child(2) > a[href="/h/h_d00008"][data-link=""]) \| minor/moderate: heading-order×1, region×1 |
| ❌ FAIL | 6 Accessibility | /intros: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /about: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /docs: axe-core — no serious/critical violations | serious: link-in-text-block (2× e.g. li:nth-child(1) > a[href$="signup"][data-link=""]); serious: scrollable-region-focusable (1× e.g. pre:nth-child(14)) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /signup: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /a/agent_d00001: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ❌ FAIL | 6 Accessibility | /h/h_d00001: axe-core — no serious/critical violations | serious: link-in-text-block (1× e.g. a[href$="pointmint.io"]) \| minor/moderate: region×1 |
| ⚠️ WARN | 7 Performance | Lighthouse mobile: Performance | score 88 |
| ✅ PASS | 7 Performance | Lighthouse mobile: Accessibility | score 96 |
| ✅ PASS | 7 Performance | Lighthouse mobile: Best Practices | score 93 |
| ✅ PASS | 7 Performance | Lighthouse mobile: SEO | score 91 |
| ✅ PASS | 10 Functional | two-humans.mjs (agent proposes → human approves → recipient accepts → contact revealed → labeled messages) | 12/12 expectations met in 5s |
| ✅ PASS | 10 Functional | ratetest.mjs (MCP 60 calls/min per credential, 61st → 429) | calls 1-60 all 200: true \| first 429 at call # 61 \| retry-after present |
| ✅ PASS | 10 Functional | After cleanup: exactly 8 demo humans / 8 agents / 4 intros | humans 8, agents 8, intros 4, public cards 20 |
| ℹ️ NOTE | 1 Routes | Unknown pages return HTTP 200 (soft 404 from SPA fallback) | Search engines may index junk URLs; consider returning 404 status for unknown routes later |
| ℹ️ NOTE | 7 Performance | Lighthouse key metrics (mobile, simulated slow 4G) | FCP 1.6 s, LCP 1.6 s, TBT 0 ms, CLS 0.226, Speed Index 1.6 s; total weight Total size was 35 KiB |
| ℹ️ NOTE | 7 Performance | Lighthouse opportunities | Cumulative Layout Shift; Browser errors were logged to the console; Avoid large layout shifts; Links rely on color to be distinguishable.; Issues were logged in the `Issues` panel in Chrome Devtools; robots.txt is not valid; Layout shift culprits; Forced reflow |
| ℹ️ NOTE | 3 Console | Cloudflare Web Analytics beacon blocked by CSP (known, ignored) | 96 occurrences of static.cloudflareinsights.com being refused by script-src 'self'. Harmless; analytics just isn't collected. Allow the host in CSP or turn off the beacon if analytics is wanted. |

## Screenshots

In `screenshots/` (desktop 1440 px, mobile 390 px, dark mode):

- [404-desktop.png](screenshots/404-desktop.png)
- [about-desktop-dark.png](screenshots/about-desktop-dark.png)
- [about-desktop.png](screenshots/about-desktop.png)
- [about-mobile.png](screenshots/about-mobile.png)
- [agent-desktop-dark.png](screenshots/agent-desktop-dark.png)
- [agent-desktop.png](screenshots/agent-desktop.png)
- [agent-mobile.png](screenshots/agent-mobile.png)
- [docs-desktop-dark.png](screenshots/docs-desktop-dark.png)
- [docs-desktop.png](screenshots/docs-desktop.png)
- [docs-mobile.png](screenshots/docs-mobile.png)
- [human-desktop-dark.png](screenshots/human-desktop-dark.png)
- [human-desktop.png](screenshots/human-desktop.png)
- [human-mobile.png](screenshots/human-mobile.png)
- [intros-desktop-dark.png](screenshots/intros-desktop-dark.png)
- [intros-desktop.png](screenshots/intros-desktop.png)
- [intros-mobile.png](screenshots/intros-mobile.png)
- [landing-desktop-dark.png](screenshots/landing-desktop-dark.png)
- [landing-desktop.png](screenshots/landing-desktop.png)
- [landing-mobile-dark.png](screenshots/landing-mobile-dark.png)
- [landing-mobile.png](screenshots/landing-mobile.png)
- [network-desktop-dark.png](screenshots/network-desktop-dark.png)
- [network-desktop.png](screenshots/network-desktop.png)
- [network-mobile-dark.png](screenshots/network-mobile-dark.png)
- [network-mobile.png](screenshots/network-mobile.png)
- [signup-desktop-dark.png](screenshots/signup-desktop-dark.png)
- [signup-desktop.png](screenshots/signup-desktop.png)
- [signup-mobile.png](screenshots/signup-mobile.png)
- [vault-desktop-dark.png](screenshots/vault-desktop-dark.png)
- [vault-desktop.png](screenshots/vault-desktop.png)
- [vault-mobile.png](screenshots/vault-mobile.png)

## Other artifacts

Lighthouse HTML/JSON (`lighthouse-mobile.report.*`), axe-core JSON per page (`axe-*.json`), raw logs of the functional scripts (`log-*.txt`), `results.json`.
