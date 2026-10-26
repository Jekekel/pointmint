-- Global handles for verified humans and company entities.
-- One namespace: a handle cannot be both a human and a company (handles table is the registry).
-- Denormalized handle columns on humans / entities stay in sync for easy JOINs and UNIQUE checks.

CREATE TABLE IF NOT EXISTS handles (
  handle TEXT PRIMARY KEY,                   -- lowercase, 3–32, [a-z0-9_-]
  kind TEXT NOT NULL CHECK (kind IN ('human', 'company')),
  owner_id TEXT NOT NULL,                   -- humans.id or entities.id (company:…)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_handles_owner ON handles(kind, owner_id);

ALTER TABLE humans ADD COLUMN handle TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_humans_handle ON humans(handle) WHERE handle IS NOT NULL;

ALTER TABLE entities ADD COLUMN handle TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_handle ON entities(handle) WHERE handle IS NOT NULL;

-- Demo humans (optional handles; /h/{id} still works without one)
INSERT OR IGNORE INTO handles (handle, kind, owner_id) VALUES ('dana-reyes', 'human', 'h_d00001');
UPDATE humans SET handle = 'dana-reyes' WHERE id = 'h_d00001' AND (handle IS NULL OR handle = '');
INSERT OR IGNORE INTO handles (handle, kind, owner_id) VALUES ('marcus-chen', 'human', 'h_d00002');
UPDATE humans SET handle = 'marcus-chen' WHERE id = 'h_d00002' AND (handle IS NULL OR handle = '');
INSERT OR IGNORE INTO handles (handle, kind, owner_id) VALUES ('priya-natarajan', 'human', 'h_d00003');
UPDATE humans SET handle = 'priya-natarajan' WHERE id = 'h_d00003' AND (handle IS NULL OR handle = '');

-- Demo company entities + founder edges (human-only claim rails; §28)
INSERT OR IGNORE INTO entities (id, type, name, source_url, is_demo) VALUES
  ('company:reyes-coffee', 'company', 'Reyes Coffee Roasters', NULL, 1);
INSERT OR IGNORE INTO entities (id, type, name, source_url, is_demo) VALUES
  ('company:ledgerly', 'company', 'Ledgerly', NULL, 1);

INSERT OR IGNORE INTO graph_edges (id, src, dst, rel, label, source_url, provenance, confidence, retrieved_at) VALUES
  ('ge:h_d00001:reyes', 'h_d00001', 'company:reyes-coffee', 'founded', 'Founded Reyes Coffee Roasters (demo)', 'pointmint:demo', 'demo', 0.9, '2026-10-25');
INSERT OR IGNORE INTO graph_edges (id, src, dst, rel, label, source_url, provenance, confidence, retrieved_at) VALUES
  ('ge:h_d00003:ledgerly', 'h_d00003', 'company:ledgerly', 'founded', 'Founded Ledgerly (demo)', 'pointmint:demo', 'demo', 0.9, '2026-10-25');

INSERT OR IGNORE INTO handles (handle, kind, owner_id) VALUES ('reyes-coffee', 'company', 'company:reyes-coffee');
UPDATE entities SET handle = 'reyes-coffee' WHERE id = 'company:reyes-coffee' AND (handle IS NULL OR handle = '');
INSERT OR IGNORE INTO handles (handle, kind, owner_id) VALUES ('ledgerly', 'company', 'company:ledgerly');
UPDATE entities SET handle = 'ledgerly' WHERE id = 'company:ledgerly' AND (handle IS NULL OR handle = '');
