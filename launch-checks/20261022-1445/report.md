# Launch check — NO-GO

- **Site:** http://localhost:8787
- **Started:** 10/22/2026, 2:46:03 PM ET
- **Runtime:** 4m 21s
- **Totals:** 345 passed · 3 failed · 15 warnings · 1 notes

## Verdict: NO-GO ❌

### Blockers (must fix before launch)

- **[9 Security] Private /launch screen is noindex and rejects requests without the key** — page 200 x-robots-tag "noindex, nofollow, noarchive", API without key 503
- **[3 Console] /index.md: no console errors** — Failed to load resource: the server responded with a status of 404 (Not Found)
- **[10 Functional] After cleanup: exactly 8 demo humans / 8 agents / 4 intros** — humans 22, agents 20, intros 9, public cards 24; non-demo members still present: Msg Tester A, Msg Tester B, Msg Tester A, Msg Tester B, E2E Tester, E2E Tester, Test Alice, Test Bob, Rate Tester, Test Alice, Test Bob, Rate Tester, Screenshot Tester, Screenshot Tester

### Warnings (worth fixing, not blocking)

- [4 Labels] /h/h_d00001: every human shown carries a "Verified human" label — 11 human elements; name shown without the label: a[/h/h_d00001.md] "raw"
- [4 Labels] /h/h_7053cd0cfecb7f07db: every human shown carries a "Verified human" label — 2 human elements; name shown without the label: a[/h/h_7053cd0cfecb7f07db.md] "raw"
- [4 Labels] /h/h_d00008: every human shown carries a "Verified human" label — 5 human elements; name shown without the label: a[/h/h_d00008.md] "raw"
- [4 Labels] /h/h_d00007: every human shown carries a "Verified human" label — 10 human elements; name shown without the label: a[/h/h_d00007.md] "raw"
- [4 Labels] /h/h_d00002: every human shown carries a "Verified human" label — 10 human elements; name shown without the label: a[/h/h_d00002.md] "raw"
- [4 Labels] /h/h_d00003: every human shown carries a "Verified human" label — 11 human elements; name shown without the label: a[/h/h_d00003.md] "raw"
- [4 Labels] /h/h_d00004: every human shown carries a "Verified human" label — 11 human elements; name shown without the label: a[/h/h_d00004.md] "raw"
- [4 Labels] /h/h_d00005: every human shown carries a "Verified human" label — 10 human elements; name shown without the label: a[/h/h_d00005.md] "raw"
- [4 Labels] /h/h_d00006: every human shown carries a "Verified human" label — 11 human elements; name shown without the label: a[/h/h_d00006.md] "raw"
- [4 Labels] /h/h_e5f28093e872a91206: every human shown carries a "Verified human" label — 2 human elements; name shown without the label: a[/h/h_e5f28093e872a91206.md] "raw"
- [4 Labels] /h/h_d646530decc1eba7d6: every human shown carries a "Verified human" label — 2 human elements; name shown without the label: a[/h/h_d646530decc1eba7d6.md] "raw"
- [4 Labels] /h/h_3fbae8db759bf78c49: every human shown carries a "Verified human" label — 2 human elements; name shown without the label: a[/h/h_3fbae8db759bf78c49.md] "raw"
- [4 Labels] /h/h_1e9abe6de507e256e9: every human shown carries a "Verified human" label — 2 human elements; name shown without the label: a[/h/h_1e9abe6de507e256e9.md] "raw"
- [2 Assets] External links reachable — 40 external URLs; problems: 404 https://agents.pointmint.io/matches, 404 https://agents.pointmint.io/activity
- [7 Performance] Lighthouse — skipped (SKIP_LIGHTHOUSE=1)

### Notes

- [6 Accessibility] axe-core minor/moderate issues — region (moderate, 9 pages)

## All checks

| Result | Area | Check | Detail |
|---|---|---|---|
| ✅ PASS | 1 Routes | GET / returns 200 | HTTP 200 in 8 ms |
| ✅ PASS | 1 Routes | GET /network returns 200 | HTTP 200 in 11 ms |
| ✅ PASS | 1 Routes | GET /vault returns 200 | HTTP 200 in 7 ms |
| ✅ PASS | 1 Routes | GET /intros returns 200 | HTTP 200 in 9 ms |
| ✅ PASS | 1 Routes | GET /about returns 200 | HTTP 200 in 7 ms |
| ✅ PASS | 1 Routes | GET /docs returns 200 | HTTP 200 in 7 ms |
| ✅ PASS | 1 Routes | GET /signup returns 200 | HTTP 200 in 8 ms |
| ✅ PASS | 1 Routes | GET /a/agent_d00001 returns 200 | HTTP 200 in 7 ms |
| ✅ PASS | 1 Routes | GET /h/h_d00001 returns 200 | HTTP 200 in 7 ms |
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
| ❌ FAIL | 9 Security | Private /launch screen is noindex and rejects requests without the key | page 200 x-robots-tag "noindex, nofollow, noarchive", API without key 503 |
| ✅ PASS | 8 SEO/share | Page <title> | PointMint Agent Network |
| ✅ PASS | 8 SEO/share | Meta description | 115 chars |
| ✅ PASS | 8 SEO/share | Canonical link | https://agents.pointmint.io/ |
| ✅ PASS | 8 SEO/share | og:title tag | PointMint Agent Network — your AI agent, networking for you |
| ✅ PASS | 8 SEO/share | og:description tag | A business network where every verified human gets exactly one AI agent — and approves every introduction it makes. |
| ✅ PASS | 8 SEO/share | og:image tag | https://agents.pointmint.io/og-image.jpg |
| ✅ PASS | 8 SEO/share | og:image image reachable | HTTP 200 image/jpeg 0.10 MB |
| ✅ PASS | 8 SEO/share | twitter:card tag | summary_large_image |
| ✅ PASS | 8 SEO/share | twitter:image tag | https://agents.pointmint.io/og-image.jpg |
| ✅ PASS | 8 SEO/share | twitter:image image reachable | HTTP 200 image/jpeg 0.10 MB |
| ✅ PASS | 8 SEO/share | Favicon reachable | /favicon.svg HTTP 200 image/svg+xml |
| ✅ PASS | 8 SEO/share | robots.txt | User-agent: * \| Allow: / \| Disallow: /api/ |
| ✅ PASS | 8 SEO/share | sitemap.xml | present |
| ✅ PASS | 4 Labels | API: every member is a "Verified human" and every agent an "AI agent" | 22 members |
| ✅ PASS | 1 Routes | / renders in a real browser | HTTP 200, title "PointMint Agent Network" |
| ✅ PASS | 4 Labels | /: every AI agent element labeled "AI agent" | 16 agent elements |
| ✅ PASS | 4 Labels | /: every human shown carries a "Verified human" label | 20 human elements |
| ✅ PASS | 4 Labels | /: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /: no console errors | clean |
| ✅ PASS | 3 Console | /: no failed requests | clean |
| ✅ PASS | 2 Assets | /: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /: images have alt text | 0 <img> |
| ✅ PASS | 2 Assets | /: video has a loadable source | src http://localhost:8787/glass/twin.webm readyState 4 error null |
| ✅ PASS | 2 Assets | /: video has a poster image | http://localhost:8787/glass/twin-poster.jpg |
| ✅ PASS | 2 Assets | /: autoplay video is muted + playsinline | muted true, playsinline true |
| ✅ PASS | 6 Accessibility | /: heading order | 1 h1; sequence 1,2,2,3,3,3,3,2,3,3,3,3,2,3,3,3,2,2,2 |
| ✅ PASS | 6 Accessibility | /: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /network renders in a real browser | HTTP 200, title "Network · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /network: every AI agent element labeled "AI agent" | 40 agent elements |
| ✅ PASS | 4 Labels | /network: every human shown carries a "Verified human" label | 44 human elements |
| ✅ PASS | 4 Labels | /network: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /network: no console errors | clean |
| ✅ PASS | 3 Console | /network: no failed requests | clean |
| ✅ PASS | 2 Assets | /network: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /network: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /network: heading order | 1 h1; sequence 1,2,2 |
| ✅ PASS | 6 Accessibility | /network: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /network: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /vault renders in a real browser | HTTP 200, title "Vault · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /vault: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /vault: every human shown carries a "Verified human" label | 24 human elements |
| ✅ PASS | 4 Labels | /vault: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /vault: no console errors | clean |
| ✅ PASS | 3 Console | /vault: no failed requests | clean |
| ✅ PASS | 2 Assets | /vault: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /vault: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /vault: heading order | 1 h1; sequence 1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2 |
| ✅ PASS | 6 Accessibility | /vault: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /vault: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /intros renders in a real browser | HTTP 200, title "Intros · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros: every AI agent element labeled "AI agent" | 12 agent elements |
| ✅ PASS | 4 Labels | /intros: every human shown carries a "Verified human" label | 12 human elements |
| ✅ PASS | 4 Labels | /intros: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros: no console errors | clean |
| ✅ PASS | 3 Console | /intros: no failed requests | clean |
| ✅ PASS | 2 Assets | /intros: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /intros: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /intros: heading order | 1 h1; sequence 1,2,2 |
| ✅ PASS | 6 Accessibility | /intros: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /intros: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /about renders in a real browser | HTTP 200, title "How it works · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /about: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /about: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /about: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /about: no console errors | clean |
| ✅ PASS | 3 Console | /about: no failed requests | clean |
| ✅ PASS | 2 Assets | /about: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /about: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /about: heading order | 1 h1; sequence 1,2,2,2,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /about: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /about: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /docs renders in a real browser | HTTP 200, title "Developers · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /docs: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /docs: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /docs: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /docs: no console errors | clean |
| ✅ PASS | 3 Console | /docs: no failed requests | clean |
| ✅ PASS | 2 Assets | /docs: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /docs: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /docs: heading order | 1 h1; sequence 1,2,2,3,3,3,3,2,2,2 |
| ✅ PASS | 6 Accessibility | /docs: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /docs: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /signup renders in a real browser | HTTP 200, title "Sign in · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /signup: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /signup: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /signup: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /signup: no console errors | clean |
| ✅ PASS | 3 Console | /signup: no failed requests | clean |
| ✅ PASS | 2 Assets | /signup: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /signup: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /signup: heading order | 1 h1; sequence 1 |
| ✅ PASS | 6 Accessibility | /signup: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /signup: layout shift (CLS) desktop | CLS 0.001 |
| ✅ PASS | 1 Routes | /a/agent_d00001 renders in a real browser | HTTP 200, title "Dana's Claude · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00001: every AI agent element labeled "AI agent" | 4 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /a/agent_d00001: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: heading order | 1 h1; sequence 1,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /a/agent_d00001: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /h/h_d00001 renders in a real browser | HTTP 200, title "Dana Reyes (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00001: every AI agent element labeled "AI agent" | 12 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00001: every human shown carries a "Verified human" label | 11 human elements; name shown without the label: a[/h/h_d00001.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /h/h_d00001: all images decode | 0 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: images have alt text | 0 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: heading order | 1 h1; sequence 1,2,2,3,3,3,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /h/h_d00001: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /h/h_d00001: layout shift (CLS) desktop | CLS 0.016 |
| ✅ PASS | 1 Routes | /matches renders in a real browser | HTTP 200, title "Matches · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /matches: every AI agent element labeled "AI agent" | 11 agent elements |
| ✅ PASS | 4 Labels | /matches: every human shown carries a "Verified human" label | 12 human elements |
| ✅ PASS | 4 Labels | /matches: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /matches: no console errors | clean |
| ✅ PASS | 3 Console | /matches: no failed requests | clean |
| ✅ PASS | 1 Routes | /activity renders in a real browser | HTTP 200, title "Activity · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /activity: every AI agent element labeled "AI agent" | 28 agent elements |
| ✅ PASS | 4 Labels | /activity: every human shown carries a "Verified human" label | 7 human elements |
| ✅ PASS | 4 Labels | /activity: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /activity: no console errors | clean |
| ✅ PASS | 3 Console | /activity: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_7053cd0cfecb7f07db renders in a real browser | HTTP 200, title "E2E Tester · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_7053cd0cfecb7f07db: every AI agent element labeled "AI agent" | 2 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_7053cd0cfecb7f07db: every human shown carries a "Verified human" label | 2 human elements; name shown without the label: a[/h/h_7053cd0cfecb7f07db.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_7053cd0cfecb7f07db: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_7053cd0cfecb7f07db: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_7053cd0cfecb7f07db: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00008 renders in a real browser | HTTP 200, title "Ben Hartley (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00008: every AI agent element labeled "AI agent" | 5 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00008: every human shown carries a "Verified human" label | 5 human elements; name shown without the label: a[/h/h_d00008.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00007 renders in a real browser | HTTP 200, title "Sofia Alvarez (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00007: every AI agent element labeled "AI agent" | 10 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00007: every human shown carries a "Verified human" label | 10 human elements; name shown without the label: a[/h/h_d00007.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00002 renders in a real browser | HTTP 200, title "Marcus Chen (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00002: every AI agent element labeled "AI agent" | 10 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00002: every human shown carries a "Verified human" label | 10 human elements; name shown without the label: a[/h/h_d00002.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00002 renders in a real browser | HTTP 200, title "Marcus-Grok · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00002: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00001 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every AI agent element labeled "AI agent" | 5 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every human shown carries a "Verified human" label | 5 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00001: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00003 renders in a real browser | HTTP 200, title "Ledgerly Assistant · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00003: every AI agent element labeled "AI agent" | 6 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00003 renders in a real browser | HTTP 200, title "Priya Natarajan (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00003: every AI agent element labeled "AI agent" | 14 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00003: every human shown carries a "Verified human" label | 11 human elements; name shown without the label: a[/h/h_d00003.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00004 renders in a real browser | HTTP 200, title "Tom Okafor (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00004: every AI agent element labeled "AI agent" | 11 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00004: every human shown carries a "Verified human" label | 11 human elements; name shown without the label: a[/h/h_d00004.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00004 renders in a real browser | HTTP 200, title "Tom's Claude · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00004: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00004: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00002 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00002: every AI agent element labeled "AI agent" | 3 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00002: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00005 renders in a real browser | HTTP 200, title "Elena Petrova (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00005: every AI agent element labeled "AI agent" | 10 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00005: every human shown carries a "Verified human" label | 10 human elements; name shown without the label: a[/h/h_d00005.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00005: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00005: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00005: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00005 renders in a real browser | HTTP 200, title "Petrova Broker Bot · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00005: every AI agent element labeled "AI agent" | 3 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00005: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00005: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00005: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00005: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00003 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00003: every AI agent element labeled "AI agent" | 3 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00003: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00007 renders in a real browser | HTTP 200, title "Northstar GPT · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00007: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00008 renders in a real browser | HTTP 200, title "Ben's Assistant · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00008: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00004 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every AI agent element labeled "AI agent" | 4 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every human shown carries a "Verified human" label | 4 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /index.md renders in a real browser | HTTP 200, title "" |
| ✅ PASS | 4 Labels | /index.md: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /index.md: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /index.md: prototype disclaimer present | found |
| ❌ FAIL | 3 Console | /index.md: no console errors | Failed to load resource: the server responded with a status of 404 (Not Found) |
| ✅ PASS | 3 Console | /index.md: no failed requests | clean |
| ✅ PASS | 1 Routes | /llms.txt renders in a real browser | HTTP 200, title "" |
| ✅ PASS | 4 Labels | /llms.txt: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /llms.txt: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /llms.txt: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /llms.txt: no console errors | clean |
| ✅ PASS | 3 Console | /llms.txt: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00006 renders in a real browser | HTTP 200, title "Jamal Wright (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00006: every AI agent element labeled "AI agent" | 12 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d00006: every human shown carries a "Verified human" label | 11 human elements; name shown without the label: a[/h/h_d00006.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00006: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00006 renders in a real browser | HTTP 200, title "Jamal-Grok · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00006: every AI agent element labeled "AI agent" | 4 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00006: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_e5f28093e872a91206 renders in a real browser | HTTP 200, title "Msg Tester A · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_e5f28093e872a91206: every AI agent element labeled "AI agent" | 2 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_e5f28093e872a91206: every human shown carries a "Verified human" label | 2 human elements; name shown without the label: a[/h/h_e5f28093e872a91206.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_e5f28093e872a91206: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_e5f28093e872a91206: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_e5f28093e872a91206: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_c1ce92aa9179a048eb renders in a real browser | HTTP 200, title "Msg Tester A's agent · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_c1ce92aa9179a048eb: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_c1ce92aa9179a048eb: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_c1ce92aa9179a048eb: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_c1ce92aa9179a048eb: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_c1ce92aa9179a048eb: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d646530decc1eba7d6 renders in a real browser | HTTP 200, title "Msg Tester B · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d646530decc1eba7d6: every AI agent element labeled "AI agent" | 2 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_d646530decc1eba7d6: every human shown carries a "Verified human" label | 2 human elements; name shown without the label: a[/h/h_d646530decc1eba7d6.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_d646530decc1eba7d6: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d646530decc1eba7d6: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d646530decc1eba7d6: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_36643cfd13ba7a942f renders in a real browser | HTTP 200, title "Msg Tester B's agent · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_36643cfd13ba7a942f: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_36643cfd13ba7a942f: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_36643cfd13ba7a942f: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_36643cfd13ba7a942f: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_36643cfd13ba7a942f: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_3fbae8db759bf78c49 renders in a real browser | HTTP 200, title "Msg Tester A · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_3fbae8db759bf78c49: every AI agent element labeled "AI agent" | 2 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_3fbae8db759bf78c49: every human shown carries a "Verified human" label | 2 human elements; name shown without the label: a[/h/h_3fbae8db759bf78c49.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_3fbae8db759bf78c49: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_3fbae8db759bf78c49: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_3fbae8db759bf78c49: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_617b4e6ee6af7d160c renders in a real browser | HTTP 200, title "Msg Tester A's agent · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_617b4e6ee6af7d160c: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_617b4e6ee6af7d160c: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_617b4e6ee6af7d160c: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_617b4e6ee6af7d160c: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_617b4e6ee6af7d160c: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_1e9abe6de507e256e9 renders in a real browser | HTTP 200, title "Msg Tester B · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_1e9abe6de507e256e9: every AI agent element labeled "AI agent" | 2 agent elements |
| ⚠️ WARN | 4 Labels | /h/h_1e9abe6de507e256e9: every human shown carries a "Verified human" label | 2 human elements; name shown without the label: a[/h/h_1e9abe6de507e256e9.md] "raw" |
| ✅ PASS | 4 Labels | /h/h_1e9abe6de507e256e9: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_1e9abe6de507e256e9: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_1e9abe6de507e256e9: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d1b2899912dd30201e renders in a real browser | HTTP 200, title "Msg Tester B's agent · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d1b2899912dd30201e: every AI agent element labeled "AI agent" | 2 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d1b2899912dd30201e: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d1b2899912dd30201e: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d1b2899912dd30201e: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d1b2899912dd30201e: no failed requests | clean |
| ✅ PASS | 2 Assets | All internal links and assets return 2xx | 111 internal URLs checked across 40 pages |
| ⚠️ WARN | 2 Assets | External links reachable | 40 external URLs; problems: 404 https://agents.pointmint.io/matches, 404 https://agents.pointmint.io/activity |
| ✅ PASS | 2 Assets | Media weight (images ≤ 2 MB, videos ≤ 8 MB) | 4 media files; landing page media total 0.23 MB |
| ✅ PASS | 5 Visual | /: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /network: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /network: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /vault: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /vault: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /intros: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /intros: layout shift (CLS) mobile | CLS 0.000 |
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
| ✅ PASS | 5 Visual | /: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /network: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /vault: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /intros: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /about: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /docs: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /signup: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /a/agent_d00001: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 5 Visual | /h/h_d00001: dark mode applies (dark background, light text) | bg luminance 0.00, text 0.97 |
| ✅ PASS | 1 Routes | 404 page is sane (no 5xx, shows "not found", has a way home, keeps nav + disclaimer) | HTTP 404; "not found" shown true; console: Failed to load resource: the server responded with a status of 404 (Not Found) |
| ✅ PASS | 6 Accessibility | axe-core: no serious/critical violations on 9 key pages |  |
| ⚠️ WARN | 7 Performance | Lighthouse | skipped (SKIP_LIGHTHOUSE=1) |
| ❌ FAIL | 10 Functional | After cleanup: exactly 8 demo humans / 8 agents / 4 intros | humans 22, agents 20, intros 9, public cards 24; non-demo members still present: Msg Tester A, Msg Tester B, Msg Tester A, Msg Tester B, E2E Tester, E2E Tester, Test Alice, Test Bob, Rate Tester, Test Alice, Test Bob, Rate Tester, Screenshot Tester, Screenshot Tester |
| ℹ️ NOTE | 6 Accessibility | axe-core minor/moderate issues | region (moderate, 9 pages) |

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
