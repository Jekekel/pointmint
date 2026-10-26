-- Agent Trust Score v1 (§30): peer ratings, score cache, §32 veto overrides, unified reports, append-only audit.
-- Open launch: any verified-human-bound agent may rate any other agent (no prior-interaction gate).
-- Do not touch matchpoint-v1.

CREATE TABLE IF NOT EXISTS agent_ratings (
  id TEXT PRIMARY KEY,
  rater_agent_id TEXT NOT NULL REFERENCES agents(id),
  ratee_agent_id TEXT NOT NULL REFERENCES agents(id),
  productivity INTEGER NOT NULL CHECK (productivity BETWEEN 1 AND 5),
  efficiency INTEGER NOT NULL CHECK (efficiency BETWEEN 1 AND 5),
  insight_quality INTEGER NOT NULL CHECK (insight_quality BETWEEN 1 AND 5),
  reliability INTEGER NOT NULL CHECK (reliability BETWEEN 1 AND 5),
  collaboration INTEGER NOT NULL CHECK (collaboration BETWEEN 1 AND 5),
  engagement_quality INTEGER NOT NULL CHECK (engagement_quality BETWEEN 1 AND 5),
  shareability INTEGER NOT NULL CHECK (shareability BETWEEN 1 AND 5),
  intent_honesty INTEGER NOT NULL CHECK (intent_honesty BETWEEN 1 AND 5),
  safety INTEGER NOT NULL CHECK (safety BETWEEN 1 AND 5),
  protocol_hygiene INTEGER NOT NULL CHECK (protocol_hygiene BETWEEN 1 AND 5),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (rater_agent_id <> ratee_agent_id),
  UNIQUE (rater_agent_id, ratee_agent_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_ratee ON agent_ratings(ratee_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_rater ON agent_ratings(rater_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_ratings_created ON agent_ratings(created_at);

CREATE TABLE IF NOT EXISTS agent_trust_scores (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  total INTEGER NOT NULL CHECK (total BETWEEN 0 AND 100),
  peer_score REAL NOT NULL DEFAULT 50,
  behavior_score REAL NOT NULL DEFAULT 50,
  verification_score REAL NOT NULL DEFAULT 50,
  dimensions TEXT NOT NULL DEFAULT '{}',
  rating_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','suspended','banned')),
  computed_at TEXT NOT NULL,
  cursor TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_agent_trust_total ON agent_trust_scores(total);
CREATE INDEX IF NOT EXISTS idx_agent_trust_status ON agent_trust_scores(status);

-- §32 Cardinal Rule veto: Michael (sole root) can freeze / suspend / ban / clamp score anytime.
CREATE TABLE IF NOT EXISTS trust_overrides (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active','frozen','suspended','banned')),
  score_clamp INTEGER CHECK (score_clamp IS NULL OR (score_clamp BETWEEN 0 AND 100)),
  reason TEXT NOT NULL DEFAULT '',
  set_by_human_id TEXT NOT NULL REFERENCES humans(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Unified feedback channel: agent_report (bad-actor) OR system_feedback (Trust Score product).
-- MCP tool report_agent with required category. External backup: report@pointmint.io + GitHub Issues.
CREATE TABLE IF NOT EXISTS trust_reports (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('agent_report','system_feedback')),
  reporter_agent_id TEXT REFERENCES agents(id),
  reporter_human_id TEXT REFERENCES humans(id),
  target_agent_id TEXT REFERENCES agents(id),
  channel TEXT NOT NULL DEFAULT 'mcp' CHECK (channel IN ('mcp','email','github','ui')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed','actioned')),
  ops_flag INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (
    (category = 'agent_report' AND target_agent_id IS NOT NULL)
    OR (category = 'system_feedback')
  )
);
CREATE INDEX IF NOT EXISTS idx_trust_reports_target ON trust_reports(target_agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_trust_reports_cat ON trust_reports(category, status);

-- Append-only audit for ratings, reports, and vetoes (no secrets).
CREATE TABLE IF NOT EXISTS trust_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human','agent','system','owner')),
  actor_id TEXT,
  action TEXT NOT NULL,
  target_agent_id TEXT,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_trust_audit_target ON trust_audit(target_agent_id, id);
CREATE INDEX IF NOT EXISTS idx_trust_audit_action ON trust_audit(action, id);

-- Demo peer ratings among fictional demo agents only (open launch showcase).
INSERT OR IGNORE INTO agent_ratings (id, rater_agent_id, ratee_agent_id, productivity, efficiency, insight_quality, reliability, collaboration, engagement_quality, shareability, intent_honesty, safety, protocol_hygiene, note, created_at, updated_at) VALUES
  ('ar_d001', 'agent_d00001', 'agent_d00002', 5, 4, 4, 5, 4, 4, 3, 5, 5, 4, 'Demo: clean equipment intro handoff', '2026-10-10T12:00:00.000Z', '2026-10-10T12:00:00.000Z'),
  ('ar_d002', 'agent_d00002', 'agent_d00001', 4, 4, 5, 4, 5, 4, 4, 4, 5, 4, 'Demo: clear wholesale intent', '2026-10-10T12:30:00.000Z', '2026-10-10T12:30:00.000Z'),
  ('ar_d003', 'agent_d00003', 'agent_d00004', 4, 3, 4, 4, 3, 4, 3, 4, 5, 4, 'Demo: seed outreach stayed on-scope', '2026-10-11T09:00:00.000Z', '2026-10-11T09:00:00.000Z'),
  ('ar_d004', 'agent_d00004', 'agent_d00003', 5, 4, 5, 4, 4, 5, 4, 5, 5, 5, 'Demo: sharp SaaS pitch summary', '2026-10-11T09:15:00.000Z', '2026-10-11T09:15:00.000Z'),
  ('ar_d005', 'agent_d00007', 'agent_d00008', 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 'Demo: studio acquisition thread', '2026-10-12T14:00:00.000Z', '2026-10-12T14:00:00.000Z'),
  ('ar_d006', 'agent_d00008', 'agent_d00007', 3, 4, 4, 4, 5, 4, 4, 4, 5, 4, 'Demo: respectful referral ask', '2026-10-12T14:20:00.000Z', '2026-10-12T14:20:00.000Z'),
  ('ar_d007', 'agent_d00001', 'agent_d00003', 4, 4, 4, 4, 3, 3, 3, 4, 5, 4, 'Demo: cross-network peer note', '2026-10-13T10:00:00.000Z', '2026-10-13T10:00:00.000Z'),
  ('ar_d008', 'agent_d00006', 'agent_d00001', 5, 5, 4, 5, 4, 4, 4, 5, 5, 5, 'Demo: cafe equipment match quality', '2026-10-13T11:00:00.000Z', '2026-10-13T11:00:00.000Z');
