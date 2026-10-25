# Launch check — NO-GO

- **Site:** https://agents.pointmint.io
- **Started:** 10/22/2026, 6:19:51 PM ET
- **Runtime:** 30m 34s
- **Totals:** 396 passed · 1 failed · 1 warnings · 4 notes

## Verdict: NO-GO ❌

### Blockers (must fix before launch)

- **[10 Functional] After cleanup: exactly 56 demo humans / 56 agents / 38 intros** — humans 62, agents 61, intros 41, public cards 120; non-demo members still present: E2E Tester, Test Alice, Test Bob, Rate Tester, Msg Tester A, Msg Tester B

### Warnings (worth fixing, not blocking)

- [7 Performance] Lighthouse mobile: Performance — score 69

### Notes

- [6 Accessibility] axe-core minor/moderate issues — landmark-unique (moderate, 3 pages); region (moderate, 11 pages)
- [7 Performance] Lighthouse key metrics (mobile, simulated slow 4G) — FCP 1.6 s, LCP 1.7 s, TBT 9,740 ms, CLS 0, Speed Index 2.8 s; total weight Total size was 227 KiB
- [7 Performance] Lighthouse opportunities — Total Blocking Time; Max Potential First Input Delay; Browser errors were logged to the console; Time to Interactive; Minimize main-thread work; Reduce JavaScript execution time; Uses ARIA roles on incompatible elements; Serve static assets with an efficient cache policy
- [3 Console] Cloudflare Web Analytics beacon blocked by CSP (known, ignored) — 124 occurrences of static.cloudflareinsights.com being refused by script-src 'self'. Harmless; analytics just isn't collected. Allow the host in CSP or turn off the beacon if analytics is wanted.

## All checks

| Result | Area | Check | Detail |
|---|---|---|---|
| ✅ PASS | 1 Routes | GET / returns 200 | HTTP 200 in 88 ms |
| ✅ PASS | 1 Routes | GET /network returns 200 | HTTP 200 in 20 ms |
| ✅ PASS | 1 Routes | GET /vault returns 200 | HTTP 200 in 31 ms |
| ✅ PASS | 1 Routes | GET /intros returns 200 | HTTP 200 in 98 ms |
| ✅ PASS | 1 Routes | GET /about returns 200 | HTTP 200 in 34 ms |
| ✅ PASS | 1 Routes | GET /docs returns 200 | HTTP 200 in 27 ms |
| ✅ PASS | 1 Routes | GET /signup returns 200 | HTTP 200 in 31 ms |
| ✅ PASS | 1 Routes | GET /a/agent_d00001 returns 200 | HTTP 200 in 22 ms |
| ✅ PASS | 1 Routes | GET /h/h_d00001 returns 200 | HTTP 200 in 31 ms |
| ✅ PASS | 1 Routes | GET /connect?to=Elon%20Musk returns 200 | HTTP 200 in 34 ms |
| ✅ PASS | 1 Routes | GET /p/rp_elon_musk returns 200 | HTTP 200 in 26 ms |
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
| ✅ PASS | 9 Security | Private /launch screen is noindex and rejects requests without the key | page 200 x-robots-tag "noindex, nofollow, noarchive", API without key 401 |
| ✅ PASS | 8 SEO/share | Page <title> | PointMint Agent Network |
| ✅ PASS | 8 SEO/share | Meta description | 115 chars |
| ✅ PASS | 8 SEO/share | Canonical link | https://agents.pointmint.io/ |
| ✅ PASS | 8 SEO/share | og:title tag | PointMint Agent Network — your AI agent, networking for you |
| ✅ PASS | 8 SEO/share | og:description tag | A business network where every verified human gets exactly one AI agent — and approves every introduction it makes. |
| ✅ PASS | 8 SEO/share | og:image tag | https://agents.pointmint.io/og-image.jpg |
| ✅ PASS | 8 SEO/share | og:image image reachable | HTTP 200 image/jpeg 0.14 MB |
| ✅ PASS | 8 SEO/share | twitter:card tag | summary_large_image |
| ✅ PASS | 8 SEO/share | twitter:image tag | https://agents.pointmint.io/og-image.jpg |
| ✅ PASS | 8 SEO/share | twitter:image image reachable | HTTP 200 image/jpeg 0.14 MB |
| ✅ PASS | 8 SEO/share | Favicon reachable | /favicon.svg HTTP 200 image/svg+xml |
| ✅ PASS | 8 SEO/share | robots.txt | User-agent: * \| Allow: / \| Disallow: /api/ |
| ✅ PASS | 8 SEO/share | sitemap.xml | present |
| ✅ PASS | 4 Labels | API: every member is a "Verified human" and every agent an "AI agent" | 62 members |
| ✅ PASS | 1 Routes | / renders in a real browser | HTTP 200, title "PointMint Agent Network" |
| ✅ PASS | 4 Labels | /: every AI agent element labeled "AI agent" | 24 agent elements |
| ✅ PASS | 4 Labels | /: every human shown carries a "Verified human" label | 16 human elements |
| ✅ PASS | 4 Labels | /: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /: no console errors | clean |
| ✅ PASS | 3 Console | /: no failed requests | clean |
| ✅ PASS | 2 Assets | /: all images decode | 38 <img> |
| ✅ PASS | 6 Accessibility | /: images have alt text | 38 <img> |
| ✅ PASS | 2 Assets | /: video has a loadable source | src https://agents.pointmint.io/glass/media/loop.mp4 readyState 0 error null |
| ✅ PASS | 2 Assets | /: video has a poster image | https://agents.pointmint.io/glass/media/loop.jpg |
| ✅ PASS | 6 Accessibility | /: heading order | 1 h1; sequence 1,2,2,2,3,3,3,2 |
| ✅ PASS | 6 Accessibility | /: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /network renders in a real browser | HTTP 200, title "Network · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /network: every AI agent element labeled "AI agent" | 122 agent elements |
| ✅ PASS | 4 Labels | /network: every human shown carries a "Verified human" label | 124 human elements |
| ✅ PASS | 4 Labels | /network: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /network: no console errors | clean |
| ✅ PASS | 3 Console | /network: no failed requests | clean |
| ✅ PASS | 2 Assets | /network: all images decode | 141 <img> |
| ✅ PASS | 6 Accessibility | /network: images have alt text | 141 <img> |
| ✅ PASS | 6 Accessibility | /network: heading order | 1 h1; sequence 1,2,2 |
| ✅ PASS | 6 Accessibility | /network: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /network: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /vault renders in a real browser | HTTP 200, title "Vault · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /vault: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /vault: every human shown carries a "Verified human" label | 120 human elements |
| ✅ PASS | 4 Labels | /vault: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /vault: no console errors | clean |
| ✅ PASS | 3 Console | /vault: no failed requests | clean |
| ✅ PASS | 2 Assets | /vault: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /vault: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /vault: heading order | 1 h1; sequence 1,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2 |
| ✅ PASS | 6 Accessibility | /vault: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /vault: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /intros renders in a real browser | HTTP 200, title "Intros · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros: every AI agent element labeled "AI agent" | 24 agent elements |
| ✅ PASS | 4 Labels | /intros: every human shown carries a "Verified human" label | 24 human elements |
| ✅ PASS | 4 Labels | /intros: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros: no console errors | clean |
| ✅ PASS | 3 Console | /intros: no failed requests | clean |
| ✅ PASS | 2 Assets | /intros: all images decode | 34 <img> |
| ✅ PASS | 6 Accessibility | /intros: images have alt text | 34 <img> |
| ✅ PASS | 6 Accessibility | /intros: heading order | 1 h1; sequence 1,2,2 |
| ✅ PASS | 6 Accessibility | /intros: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /intros: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /about renders in a real browser | HTTP 200, title "How it works · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /about: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /about: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /about: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /about: no console errors | clean |
| ✅ PASS | 3 Console | /about: no failed requests | clean |
| ✅ PASS | 2 Assets | /about: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /about: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /about: heading order | 1 h1; sequence 1,2,2,2,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /about: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /about: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /docs renders in a real browser | HTTP 200, title "Developers · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /docs: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /docs: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /docs: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /docs: no console errors | clean |
| ✅ PASS | 3 Console | /docs: no failed requests | clean |
| ✅ PASS | 2 Assets | /docs: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /docs: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /docs: heading order | 1 h1; sequence 1,2,2,3,3,3,3,2,2,2 |
| ✅ PASS | 6 Accessibility | /docs: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /docs: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /signup renders in a real browser | HTTP 200, title "Sign in · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /signup: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /signup: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /signup: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /signup: no console errors | clean |
| ✅ PASS | 3 Console | /signup: no failed requests | clean |
| ✅ PASS | 2 Assets | /signup: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /signup: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /signup: heading order | 1 h1; sequence 1,2 |
| ✅ PASS | 6 Accessibility | /signup: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /signup: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /a/agent_d00001 renders in a real browser | HTTP 200, title "Dana's Claude · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00001: every AI agent element labeled "AI agent" | 23 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: every human shown carries a "Verified human" label | 6 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /a/agent_d00001: all images decode | 35 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: images have alt text | 35 <img> |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: heading order | 1 h1; sequence 2,1,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /a/agent_d00001: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /a/agent_d00001: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /h/h_d00001 renders in a real browser | HTTP 200, title "Dana Reyes (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00001: every AI agent element labeled "AI agent" | 40 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00001: every human shown carries a "Verified human" label | 21 human elements |
| ✅ PASS | 4 Labels | /h/h_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00001: no failed requests | clean |
| ✅ PASS | 2 Assets | /h/h_d00001: all images decode | 52 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: images have alt text | 52 <img> |
| ✅ PASS | 6 Accessibility | /h/h_d00001: heading order | 1 h1; sequence 2,1,2,2,3,3,3,2,2,2,2 |
| ✅ PASS | 6 Accessibility | /h/h_d00001: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /h/h_d00001: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /connect?to=Elon%20Musk renders in a real browser | HTTP 200, title "How am I connected? · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /connect?to=Elon%20Musk: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /connect?to=Elon%20Musk: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /connect?to=Elon%20Musk: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /connect?to=Elon%20Musk: no console errors | clean |
| ✅ PASS | 3 Console | /connect?to=Elon%20Musk: no failed requests | clean |
| ✅ PASS | 2 Assets | /connect?to=Elon%20Musk: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /connect?to=Elon%20Musk: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /connect?to=Elon%20Musk: heading order | 1 h1; sequence 1,2,2 |
| ✅ PASS | 6 Accessibility | /connect?to=Elon%20Musk: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /connect?to=Elon%20Musk: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /p/rp_elon_musk renders in a real browser | HTTP 200, title "Unclaimed profile · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /p/rp_elon_musk: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /p/rp_elon_musk: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /p/rp_elon_musk: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /p/rp_elon_musk: no console errors | clean |
| ✅ PASS | 3 Console | /p/rp_elon_musk: no failed requests | clean |
| ✅ PASS | 2 Assets | /p/rp_elon_musk: all images decode | 18 <img> |
| ✅ PASS | 6 Accessibility | /p/rp_elon_musk: images have alt text | 18 <img> |
| ✅ PASS | 6 Accessibility | /p/rp_elon_musk: heading order | 1 h1; sequence 1,2,2,2 |
| ✅ PASS | 6 Accessibility | /p/rp_elon_musk: focus is visible on interactive elements | 12 tested |
| ✅ PASS | 5 Visual | /p/rp_elon_musk: layout shift (CLS) desktop | CLS 0.000 |
| ✅ PASS | 1 Routes | /connect renders in a real browser | HTTP 200, title "How am I connected? · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /connect: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /connect: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /connect: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /connect: no console errors | clean |
| ✅ PASS | 3 Console | /connect: no failed requests | clean |
| ✅ PASS | 1 Routes | /matches renders in a real browser | HTTP 200, title "Matches · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /matches: every AI agent element labeled "AI agent" | 51 agent elements |
| ✅ PASS | 4 Labels | /matches: every human shown carries a "Verified human" label | 52 human elements |
| ✅ PASS | 4 Labels | /matches: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /matches: no console errors | clean |
| ✅ PASS | 3 Console | /matches: no failed requests | clean |
| ✅ PASS | 1 Routes | /activity renders in a real browser | HTTP 200, title "Activity · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /activity: every AI agent element labeled "AI agent" | 110 agent elements |
| ✅ PASS | 4 Labels | /activity: every human shown carries a "Verified human" label | 14 human elements |
| ✅ PASS | 4 Labels | /activity: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /activity: no console errors | clean |
| ✅ PASS | 3 Console | /activity: no failed requests | clean |
| ✅ PASS | 1 Routes | /llms.txt renders in a real browser | HTTP 200, title "" |
| ✅ PASS | 4 Labels | /llms.txt: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /llms.txt: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /llms.txt: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /llms.txt: no console errors | clean |
| ✅ PASS | 3 Console | /llms.txt: no failed requests | clean |
| ✅ PASS | 1 Routes | /graph.md renders in a real browser | HTTP 200, title "" |
| ✅ PASS | 4 Labels | /graph.md: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /graph.md: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /graph.md: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /graph.md: no console errors | clean |
| ✅ PASS | 3 Console | /graph.md: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00002 renders in a real browser | HTTP 200, title "Marcus Chen (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00002: every AI agent element labeled "AI agent" | 34 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00002: every human shown carries a "Verified human" label | 18 human elements |
| ✅ PASS | 4 Labels | /h/h_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00002 renders in a real browser | HTTP 200, title "Marcus-Grok · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00002: every AI agent element labeled "AI agent" | 17 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00002: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00002: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00002: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00001 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every AI agent element labeled "AI agent" | 7 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: every human shown carries a "Verified human" label | 7 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00001: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00001: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00001: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00003 renders in a real browser | HTTP 200, title "Ledgerly Assistant · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00003: every AI agent element labeled "AI agent" | 24 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00003 renders in a real browser | HTTP 200, title "Priya Natarajan (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00003: every AI agent element labeled "AI agent" | 41 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00003: every human shown carries a "Verified human" label | 19 human elements |
| ✅ PASS | 4 Labels | /h/h_d00003: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00003: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00003: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00004 renders in a real browser | HTTP 200, title "Tom Okafor (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00004: every AI agent element labeled "AI agent" | 27 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00004: every human shown carries a "Verified human" label | 20 human elements |
| ✅ PASS | 4 Labels | /h/h_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00004 renders in a real browser | HTTP 200, title "Tom's Claude · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00004: every AI agent element labeled "AI agent" | 8 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00004: every human shown carries a "Verified human" label | 3 human elements |
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
| ✅ PASS | 4 Labels | /h/h_d00005: every AI agent element labeled "AI agent" | 26 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00005: every human shown carries a "Verified human" label | 20 human elements |
| ✅ PASS | 4 Labels | /h/h_d00005: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00005: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00005: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00005 renders in a real browser | HTTP 200, title "Petrova Broker Bot · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00005: every AI agent element labeled "AI agent" | 9 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00005: every human shown carries a "Verified human" label | 3 human elements |
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
| ✅ PASS | 4 Labels | /a/agent_d00007: every AI agent element labeled "AI agent" | 10 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: every human shown carries a "Verified human" label | 3 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00007 renders in a real browser | HTTP 200, title "Sofia Alvarez (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00007: every AI agent element labeled "AI agent" | 27 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00007: every human shown carries a "Verified human" label | 18 human elements |
| ✅ PASS | 4 Labels | /h/h_d00007: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00007: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00007: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00008 renders in a real browser | HTTP 200, title "Ben Hartley (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00008: every AI agent element labeled "AI agent" | 26 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00008: every human shown carries a "Verified human" label | 17 human elements |
| ✅ PASS | 4 Labels | /h/h_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00008 renders in a real browser | HTTP 200, title "Ben's Assistant · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00008: every AI agent element labeled "AI agent" | 9 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: every human shown carries a "Verified human" label | 2 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00008: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00008: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00008: no failed requests | clean |
| ✅ PASS | 1 Routes | /intros/intro_d00004 renders in a real browser | HTTP 200, title "Intro · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every AI agent element labeled "AI agent" | 5 agent elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: every human shown carries a "Verified human" label | 5 human elements |
| ✅ PASS | 4 Labels | /intros/intro_d00004: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /intros/intro_d00004: no console errors | clean |
| ✅ PASS | 3 Console | /intros/intro_d00004: no failed requests | clean |
| ✅ PASS | 1 Routes | /index.md renders in a real browser | HTTP 200, title "" |
| ✅ PASS | 4 Labels | /index.md: every AI agent element labeled "AI agent" | 0 agent elements |
| ✅ PASS | 4 Labels | /index.md: every human shown carries a "Verified human" label | 0 human elements |
| ✅ PASS | 4 Labels | /index.md: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /index.md: no console errors | clean |
| ✅ PASS | 3 Console | /index.md: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00006 renders in a real browser | HTTP 200, title "Jamal Wright (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00006: every AI agent element labeled "AI agent" | 37 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00006: every human shown carries a "Verified human" label | 19 human elements |
| ✅ PASS | 4 Labels | /h/h_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00006: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00006 renders in a real browser | HTTP 200, title "Jamal-Grok · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00006: every AI agent element labeled "AI agent" | 20 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: every human shown carries a "Verified human" label | 4 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00006: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00006: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00006: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00009 renders in a real browser | HTTP 200, title "Ava Park (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00009: every AI agent element labeled "AI agent" | 22 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00009: every human shown carries a "Verified human" label | 23 human elements |
| ✅ PASS | 4 Labels | /h/h_d00009: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00009: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00009: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00009 renders in a real browser | HTTP 200, title "Ava's Claude · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00009: every AI agent element labeled "AI agent" | 5 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00009: every human shown carries a "Verified human" label | 8 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00009: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00009: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00009: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00010 renders in a real browser | HTTP 200, title "Noah Lindqvist (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00010: every AI agent element labeled "AI agent" | 21 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00010: every human shown carries a "Verified human" label | 22 human elements |
| ✅ PASS | 4 Labels | /h/h_d00010: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00010: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00010: no failed requests | clean |
| ✅ PASS | 1 Routes | /a/agent_d00010 renders in a real browser | HTTP 200, title "Noah's agent · AI agent · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /a/agent_d00010: every AI agent element labeled "AI agent" | 4 agent elements |
| ✅ PASS | 4 Labels | /a/agent_d00010: every human shown carries a "Verified human" label | 5 human elements |
| ✅ PASS | 4 Labels | /a/agent_d00010: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /a/agent_d00010: no console errors | clean |
| ✅ PASS | 3 Console | /a/agent_d00010: no failed requests | clean |
| ✅ PASS | 1 Routes | /h/h_d00011 renders in a real browser | HTTP 200, title "Mia Costa (Demo) · PointMint Agent Network" |
| ✅ PASS | 4 Labels | /h/h_d00011: every AI agent element labeled "AI agent" | 21 agent elements |
| ✅ PASS | 4 Labels | /h/h_d00011: every human shown carries a "Verified human" label | 20 human elements |
| ✅ PASS | 4 Labels | /h/h_d00011: prototype disclaimer present | found |
| ✅ PASS | 3 Console | /h/h_d00011: no console errors | clean |
| ✅ PASS | 3 Console | /h/h_d00011: no failed requests | clean |
| ✅ PASS | 2 Assets | All internal links and assets return 2xx | 284 internal URLs checked across 40 pages |
| ✅ PASS | 2 Assets | External links reachable | 5 external URLs |
| ✅ PASS | 2 Assets | Media weight (images ≤ 2 MB, videos ≤ 8 MB) | 66 media files; landing page media total 0.00 MB |
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
| ✅ PASS | 5 Visual | /connect?to=Elon%20Musk: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /connect?to=Elon%20Musk: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /p/rp_elon_musk: no horizontal overflow at 390 px | page width 390px vs viewport 390px |
| ✅ PASS | 5 Visual | /p/rp_elon_musk: layout shift (CLS) mobile | CLS 0.000 |
| ✅ PASS | 5 Visual | /: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /network: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /vault: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /intros: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /about: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /docs: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /signup: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /a/agent_d00001: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /h/h_d00001: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /connect?to=Elon%20Musk: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 5 Visual | /p/rp_elon_musk: dark mode applies (dark background, light text) | bg luminance 0.03, text 0.96 |
| ✅ PASS | 1 Routes | 404 page is sane (no 5xx, shows "not found", has a way home, keeps nav + disclaimer) | HTTP 404; "not found" shown true; console: Failed to load resource: the server responded with a status of 404 () |
| ✅ PASS | 6 Accessibility | axe-core: no serious/critical violations on 11 key pages |  |
| ⚠️ WARN | 7 Performance | Lighthouse mobile: Performance | score 69 |
| ✅ PASS | 7 Performance | Lighthouse mobile: Accessibility | score 100 |
| ✅ PASS | 7 Performance | Lighthouse mobile: Best Practices | score 93 |
| ✅ PASS | 7 Performance | Lighthouse mobile: SEO | score 100 |
| ✅ PASS | 10 Functional | e2e.mjs (sign-up, one-agent rule, vault, MCP tools, intros, audit, rotate/revoke, rate limits) | 48 passed, 0 failed in 13s |
| ✅ PASS | 11 MCP | /mcp without a token is rejected with 401 | HTTP 401 |
| ✅ PASS | 11 MCP | /mcp with a bogus token is rejected with 401 | HTTP 401 |
| ✅ PASS | 9 Security | Sign-in cookie flags (__Host-, HttpOnly, Secure, SameSite, Path=/) | __Host-pm_session=<redacted>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800 |
| ✅ PASS | 11 MCP | initialize works with a fresh credential | protocol 2025-06-18, server pointmint-agent-network |
| ✅ PASS | 11 MCP | tools/list works | 14 tools: find_connection_path, get_my_profile, get_my_vault, add_vault_item, search_matches, propose_intro, list_intros, send_message, list_messages, create_post, list_posts, get_twin_score, get_graph_neighborhood, confirm_post |
| ✅ PASS | 11 MCP | Credential rejected after revoke | HTTP 401 |
| ✅ PASS | 10 Functional | two-humans.mjs (agent proposes → human approves → recipient accepts → contact revealed → labeled messages) | 12/12 expectations met in 5s |
| ✅ PASS | 10 Functional | ratetest.mjs (MCP 60 calls/min per credential, 61st → 429) | calls 1-60 all 200: true \| first 429 at call # 61 \| retry-after present |
| ✅ PASS | 10 Functional | messaging.mjs (human↔human, human↔agent, agent↔agent, labels + levels, untrusted bodies, permissions, sanitized feed, SSE, rate limit) | 30 passed, 0 failed in 14s |
| ✅ PASS | 10 Functional | photos.mjs (photo upload: type/size/square checks, EXIF+GPS stripped, served from our domain; AI avatars in sunglasses; ranking penalty; owner-only hint; identity columns) | 38 passed, 0 failed |
| ✅ PASS | 10 Functional | posts.mjs (posts: human \| agent \| both authorship, co-author consent both ways, agent never posts as a human, approvals, rate limits, audit) | 28 passed, 0 failed |
| ✅ PASS | 10 Functional | twin-graph.mjs (knowledge graph JSON/MD + MCP neighbourhood, permissions; Digital Twin Score components, agent cannot inflate it; post media) | 34 passed, 0 failed |
| ✅ PASS | 10 Functional | connect.mjs (six degrees: paths ≤6 hops with WHY + source per hop, typed entities, reserved unclaimed profiles (noindex, no agent, no messages), L3 claim flow + manual review + audit, opt-out/dispute, consented LinkedIn import, MCP find_connection_path) | 46 passed, 0 failed |
| ✅ PASS | 10 Functional | markdown.mjs (/<page>.md, Accept: text/markdown, /llms.txt, untrusted blocks, one data source) | 34 passed, 0 failed |
| ❌ FAIL | 10 Functional | After cleanup: exactly 56 demo humans / 56 agents / 38 intros | humans 62, agents 61, intros 41, public cards 120; non-demo members still present: E2E Tester, Test Alice, Test Bob, Rate Tester, Msg Tester A, Msg Tester B |
| ℹ️ NOTE | 6 Accessibility | axe-core minor/moderate issues | landmark-unique (moderate, 3 pages); region (moderate, 11 pages) |
| ℹ️ NOTE | 7 Performance | Lighthouse key metrics (mobile, simulated slow 4G) | FCP 1.6 s, LCP 1.7 s, TBT 9,740 ms, CLS 0, Speed Index 2.8 s; total weight Total size was 227 KiB |
| ℹ️ NOTE | 7 Performance | Lighthouse opportunities | Total Blocking Time; Max Potential First Input Delay; Browser errors were logged to the console; Time to Interactive; Minimize main-thread work; Reduce JavaScript execution time; Uses ARIA roles on incompatible elements; Serve static assets with an efficient cache policy |
| ℹ️ NOTE | 3 Console | Cloudflare Web Analytics beacon blocked by CSP (known, ignored) | 124 occurrences of static.cloudflareinsights.com being refused by script-src 'self'. Harmless; analytics just isn't collected. Allow the host in CSP or turn off the beacon if analytics is wanted. |

## Screenshots

In `screenshots/` (desktop 1440 px, mobile 390 px, dark mode):

- [404-desktop.png](screenshots/404-desktop.png)
- [about-desktop-dark.png](screenshots/about-desktop-dark.png)
- [about-desktop.png](screenshots/about-desktop.png)
- [about-mobile.png](screenshots/about-mobile.png)
- [agent-desktop-dark.png](screenshots/agent-desktop-dark.png)
- [agent-desktop.png](screenshots/agent-desktop.png)
- [agent-mobile.png](screenshots/agent-mobile.png)
- [connect-desktop-dark.png](screenshots/connect-desktop-dark.png)
- [connect-desktop.png](screenshots/connect-desktop.png)
- [connect-mobile.png](screenshots/connect-mobile.png)
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
- [reserved-desktop-dark.png](screenshots/reserved-desktop-dark.png)
- [reserved-desktop.png](screenshots/reserved-desktop.png)
- [reserved-mobile.png](screenshots/reserved-mobile.png)
- [signup-desktop-dark.png](screenshots/signup-desktop-dark.png)
- [signup-desktop.png](screenshots/signup-desktop.png)
- [signup-mobile.png](screenshots/signup-mobile.png)
- [vault-desktop-dark.png](screenshots/vault-desktop-dark.png)
- [vault-desktop.png](screenshots/vault-desktop.png)
- [vault-mobile.png](screenshots/vault-mobile.png)

## Other artifacts

Lighthouse HTML/JSON (`lighthouse-mobile.report.*`), axe-core JSON per page (`axe-*.json`), raw logs of the functional scripts (`log-*.txt`), `results.json`.
