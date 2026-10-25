-- Six degrees of separation + reserved public-figure profiles + the claim flow.
-- entities: typed, non-person nodes (companies, schools, investors, industries, events, deals, skills).
CREATE TABLE entities (
  id TEXT PRIMARY KEY,                       -- e.g. company:stripe, school:mit, industry:fintech, event:demo-day-2026
  type TEXT NOT NULL CHECK (type IN ('company','school','investor','industry','event','deal','skill')),
  name TEXT NOT NULL,
  source_url TEXT,                           -- where the entity itself is described (public source)
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_entities_type ON entities(type);
-- typed edges with provenance and confidence. src/dst are human ids (h_…), reserved profile ids (rp_…) or entity ids.
CREATE TABLE graph_edges (
  id TEXT PRIMARY KEY,
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  rel TEXT NOT NULL,                         -- founded, co_founded, led, worked_at, studied_at, invests_with, attended, party_to, in_industry, has_skill
  label TEXT NOT NULL DEFAULT '',            -- human-readable WHY ("Co-founded Stripe in 2010")
  source_url TEXT,                           -- public source for this exact fact (required for public_source)
  provenance TEXT NOT NULL CHECK (provenance IN ('public_source','member','member_import','system','demo')),
  confidence REAL NOT NULL DEFAULT 0.7 CHECK (confidence BETWEEN 0 AND 1),
  retrieved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (provenance <> 'public_source' OR source_url IS NOT NULL)
);
CREATE INDEX idx_gedges_src ON graph_edges(src);
CREATE INDEX idx_gedges_dst ON graph_edges(dst);
-- reserved, unclaimed public-figure profiles: public facts only, no agent, no messages, no photo, noindex until claimed.
CREATE TABLE reserved_profiles (
  id TEXT PRIMARY KEY,                       -- rp_…
  name TEXT NOT NULL,
  name_norm TEXT NOT NULL,                   -- normalized for the claim name match
  title TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  high_profile INTEGER NOT NULL DEFAULT 1,   -- 1 = every claim goes to manual review
  is_demo INTEGER NOT NULL DEFAULT 0,        -- fictional reserved profile used to demo the full claim flow
  status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','claim_review','claimed','hidden')),
  claimed_by TEXT REFERENCES humans(id),
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_reserved_name ON reserved_profiles(name_norm);
-- claims: L3 verification (simulated ID + selfie in the prototype), name match, manual review for high-profile names.
CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES reserved_profiles(id),
  human_id TEXT NOT NULL REFERENCES humans(id),
  legal_name TEXT NOT NULL DEFAULT '',
  id_check TEXT NOT NULL DEFAULT 'pending',      -- simulated_pass | simulated_fail | pending (vendor TBD)
  selfie_check TEXT NOT NULL DEFAULT 'pending',
  name_match REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('started','name_mismatch','manual_review','approved','rejected','withdrawn')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  decided_at TEXT
);
CREATE INDEX idx_claims_profile ON claims(profile_id);
CREATE INDEX idx_claims_human ON claims(human_id);
-- removal / correction / dispute requests about a reserved profile (anyone may file; reviewed by a person).
CREATE TABLE reserved_requests (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES reserved_profiles(id),
  kind TEXT NOT NULL CHECK (kind IN ('removal','correction','dispute')),
  requester_name TEXT NOT NULL DEFAULT '',
  relationship TEXT NOT NULL DEFAULT '',       -- self | representative | other
  contact TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','declined')),
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
ALTER TABLE humans ADD COLUMN verify_level TEXT;        -- NULL = derive (L1 when phone verified); 'L3' after a claim's simulated L3 check
ALTER TABLE humans ADD COLUMN claimed_profile_id TEXT;
