# Multilingual market reference — non-US professional networks

*PointMint Agent Network · research note · 2026-10-25 · America/New_York*  
*Companion to SPEC **§39 Multilingual / real-time translation**. No secrets. Sizes are approximate and cited with year; **unknown** when not verifiable from a primary or reputable secondary source.*

## Why this doc

LinkedIn is the US/English-first baseline competitor. PointMint must work as a **completely multilingual** business network so a member can talk on the fly with someone in Japan, Mexico, Germany, or elsewhere — without the English-only ceiling LinkedIn still imposes in practice.

This table surveys **regional professional / career platforms outside the US** across **Europe**, **Latin America**, and **Asia**. Pure consumer chat apps are noted only where a market treats them as the de-facto business network; preference is for true pro/career networks.

## Michael’s PointMint multilingual UX requirements

Cross-ref: SPEC **§39**. Product bar (voice, 2026-10-25):

| # | Requirement | UI / system implication |
|---|---|---|
| (a) | **Type in English (or your preferred language) and send to anyone** regardless of their language | Outbound is written in the sender’s language; Worker-side translation serves the recipient’s preferred language on read |
| (b) | Incoming other-language messages show a **flag icon** for the language being spoken | Message bubble badge with regional flag + language label (e.g. 🇯🇵 Japanese) |
| (c) | **Real-time translation** with visible **Translating…** indicator | Badge states: `Translating…` → `Shown in English · original Japanese` (or honest `translation pending` when no provider key) |

Architecture (SPEC §39): **Worker-side translation** so MCP agents and the web share one path; client only displays. Preference stored as BCP-47 on `humans.preferred_language`.

---

## Contrast (not a row in the competitive table)

| Platform | Market | Primary language | Rough size | Notes |
|---|---|---|---|---|
| **LinkedIn** | Global (US HQ) | English-first UI & culture | ~1B+ members globally (LinkedIn disclosures; exact 2026 figure not re-audited here) | Baseline competitor. Strong in many markets; local UI languages exist, but the network gravity and content remain English-heavy. PointMint differentiates on true multilingual conversation UX. |

---

## Europe

| Platform | Primary country / market | Primary language | Rough size (cite year) | Notes |
|---|---|---|---|---|
| **XING** | Germany + DACH (AT, CH) | German | **~21–22.5M members** DACH (corp. “über 21 Mio.”; Statista **22.5M** Q2 **2024**). EU MAU under DSA: **12.9M** avg Aug 2025–Jan **2026** (XING transparency). | Still the core DACH professional network; LinkedIn has gained share in DE but XING remains large. |
| **Viadeo** | France | French | Claims **~7.5M** FR members (company copy). Consumer use ~**1%** FR vs LinkedIn **19%** (Statista Dec **2024**, via secondary brief). | Alive but marginal vs LinkedIn FR. Include for language-market coverage (fr). |
| **InfoJobs** | Spain (+ LatAm brand footprint historically) | Spanish | Secondary roundups cite **~15M** registered users in Spain (**2025** portals guides). Treat as approximate. | Spain’s dominant job/career portal; networking lighter than XING, but the language market (es) is critical. |
| **TenChat** | Russia | Russian | **~4.3M MAU**, **~150k DAU** (late **2025**, platform/Yandex Metrika cited in RU commentary). | Post-LinkedIn RU professional / IT community network. Prefer over unclear “Uni” branding. |
| **GoldenLine** | Poland | Polish | Peak **>2.7M** accounts (**2018**, Agora). **Ceased operations Oct 2024** (CB Insights / industry). | Historical PL pro network — **defunct**. Listed so builders do not target a dead stack; PL market today is largely LinkedIn + job boards. |
| **beBee** | Spain / global (lighter) | Spanish (+ multi) | Historical ~**4M** in Spain by **2017**; **current size unknown** (no robust 2025–26 disclosure found). | Weak/unclear today; not a primary dependency. |
| **Probiz** | Europe (candidate name) | — | **Unknown / not verified as a live major network in 2025–26 search** | Could not confirm a relevant live pro network under this name at research time; omit from active shortlist until verified. |

---

## Latin America

| Platform | Primary country / market | Primary language | Rough size (cite year) | Notes |
|---|---|---|---|---|
| **Computrabajo** | LatAm multi-country (MX, CO, PE, AR, CL, etc.) | Spanish | **+62M** “candidatos activos” (Computrabajo members pages); partner pages cite **~68M** active candidates. Site traffic claim **~89M** monthly visits (Sep **’26** site counter). | Largest LatAm job/career reach; more job-board than social graph, but *the* professional destination in many Spanish markets. |
| **OCC Mundial** | Mexico | Spanish | **>13M** registered users seeking jobs in **2025** (OCC annual labor report, Jan **2026** press). | Mexico’s leading online job board / career site. |
| **Bumeran** | LatAm (AR, PE, MX, etc.; Navent group) | Spanish | Active listings often cited (~**30k+** vacantes in secondary MX roundups **2025**); **member/MAU count unknown** from primary source here. | Major LatAm job brand; size of network graph less transparent than Computrabajo/OCC. |
| **Magneto 365** | Colombia (+ LatAm expansion; HQ Medellín) | Spanish | Candidate/MAU **unknown** (company is AI recruiting SaaS; LinkedIn company page shows employer footprint, not consumer MAU). | More ATS/recruiting software than open pro social network — include as LatAm talent-stack player, not a LinkedIn peer. |
| **InfoJobs** (LatAm relevance) | See Europe row; Spanish language market overlaps LatAm diaspora & ES | Spanish | See above | Language preference `es` covers ES + LatAm readers even when the job board brand differs by country. |

---

## Asia

| Platform | Primary country / market | Primary language | Rough size (cite year) | Notes |
|---|---|---|---|---|
| **Maimai (脉脉)** | China | Mandarin Chinese | **~120M** registered; **~35M MAU** (Maimai / partner marketing **2025**; secondary SWOT cites similar into **2026**). | Dominant China pro community after LinkedIn China exit. |
| **BOSS Zhipin (BOSS直聘)** | China | Mandarin Chinese | QuestMobile Apr **2025**: **~51.7M MAU** (recruitment apps ranking). | Hiring-first, chat-native; functions as China’s largest active job/pro engagement app — stronger MAU than classic boards. |
| **Zhaopin (智联招聘)** | China | Mandarin Chinese | QuestMobile Apr **2025**: **~26.6M MAU**; Dec **2025** secondary ~**20.8M MAU**. | Legacy white-collar board; still large. |
| **51job (前程无忧)** | China | Mandarin Chinese | QuestMobile Apr **2025**: **~17.6M MAU**; claims very large resume DB (employer marketing). | Legacy board; MAU behind BOSS/Zhaopin. |
| **Wantedly** | Japan | Japanese | **4.32M** registered JP users (FY ending Aug **2025** filings); **>4.5M** by mid-**2026** (Wantedly PR Jun 2026; IR ~**4.57M**). | True business SNS / empathy hiring — best JP LinkedIn-class product analog. |
| **Naukri** | India | English (+ Indic UI/locales) | Resume DB **115M** (Q4 FY26 / Mar **2026** Info Edge); **~118M** profiles & **~13M MAU** (mid-**2026** company/press). | India’s dominant career platform; English-primary professional register with multilingual India reality. |
| **WeCom / WeChat Work (企业微信)** | China | Mandarin Chinese | Enterprise seat counts **unknown** in public consumer MAU terms (Tencent enterprise product). | Workplace messaging + org directory — not a public pro social network; note for China B2B comms, not PointMint’s public graph. |
| **LINE** | Japan / SEA | Japanese (+ local) | Massive messenger; **not** a professional network | Exclude from pro-network shortlist; market uses Wantedly + LinkedIn JP for careers. |
| **KakaoTalk / Kakao** | Korea | Korean | Dominant messenger; Kakao’s career surfaces exist but **pro-network MAU unknown** | Prefer treating Kakao as messenger; Korea pro hiring also uses Saramin/JobKorea (job boards) + LinkedIn. |

---

## Recommended active shortlist for PointMint language planning

Prioritize BCP-47 prefs and flag chrome for languages implied by live regional platforms:

| Region | Languages to treat as first-class | Anchor platforms |
|---|---|---|
| Europe | `de`, `fr`, `es`, `ru`, `pl` (readers remain even if GoldenLine is dead) | XING, Viadeo, InfoJobs, TenChat |
| LatAm | `es`, `pt` (Brazil via future rows / LinkedIn BR contrast) | Computrabajo, OCC, Bumeran |
| Asia | `zh`, `ja`, `ko`, `hi` (+ `en` for IN professionals) | Maimai, BOSS Zhipin, Wantedly, Naukri |

---

## How this table feeds SPEC §39

1. **`humans.preferred_language` (BCP-47)** — dashboard control; defaults `en`; options cover the languages above so a JP or MX member is not forced into English UI assumptions.
2. **Worker-side `translate` helper** (`TRANSLATE_PROVIDER`, optional `TRANSLATE_API_KEY` secret) — one path for web message read and later MCP/agents; stub returns honest `unavailable` / pending chrome (no invented translations).
3. **Flag + Translating… UI** — incoming non-preferred-language messages show a **flag** for the spoken language and a **Translating…** / “Shown in X · original Y” badge (Michael requirements a–c).
4. **Market motivation** — Europe (XING/Viadeo/InfoJobs/TenChat), LatAm (Computrabajo/OCC/Bumeran), and Asia (Maimai/Wantedly/Naukri/BOSS) prove professional networking is **not monolingual**; PointMint’s differentiator vs LinkedIn is conversational multilingual UX, not another English-only feed.

### Sources (non-exhaustive)

- XING corporate / DSA MAU transparency; Statista DACH members Q2 2024  
- Wantedly Inc. IR / PR (JP registered users 2025–2026)  
- Info Edge / Naukri investor materials (resume DB & MAU 2026)  
- QuestMobile China recruitment app MAU (Apr 2025) via industry write-ups  
- Maimai marketing / partner briefs (~120M / ~35M MAU, 2025)  
- Computrabajo / Pandapé partner pages; OCC 2025 annual labor press (Jan 2026)  
- TenChat RU commentary citing ~4.3M MAU (late 2025); GoldenLine ceased Oct 2024 (CB Insights)  
- Macromedia / Statista secondary briefs on Viadeo FR usage vs LinkedIn (2024)

*If a figure could not be tied to a dated primary disclosure, the table says **unknown** rather than inventing precision.*
