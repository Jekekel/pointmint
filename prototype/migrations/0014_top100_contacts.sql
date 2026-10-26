-- Reciprocal Top 100: each verified human may list up to 100 other verified humans.
-- Reciprocity = contact also lists the list owner in their top 100 (computed at query time via LEFT JOIN).
-- Entries must be L1+ verified humans (phone_verified_at). Reserved profiles and agents are rejected in the Worker.
CREATE TABLE IF NOT EXISTS top100_contacts (
  human_id TEXT NOT NULL REFERENCES humans(id),
  contact_human_id TEXT NOT NULL REFERENCES humans(id),
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 100),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (human_id <> contact_human_id),
  UNIQUE (human_id, contact_human_id),
  UNIQUE (human_id, rank)
);
CREATE INDEX IF NOT EXISTS idx_top100_owner ON top100_contacts(human_id, rank);
CREATE INDEX IF NOT EXISTS idx_top100_contact ON top100_contacts(contact_human_id, human_id);

-- Demo seed among fictional demo members only (no reserved public figures).
-- Dana ↔ Marcus mutual; Dana → Priya one-way; Marcus → Tom one-way; Priya ↔ Tom mutual; Jamal lists Dana (not back).
INSERT OR IGNORE INTO top100_contacts (human_id, contact_human_id, rank, created_at, updated_at) VALUES
  ('h_d00001', 'h_d00002', 1, '2026-10-20T12:00:00.000Z', '2026-10-20T12:00:00.000Z'),
  ('h_d00001', 'h_d00003', 2, '2026-10-20T12:00:00.000Z', '2026-10-20T12:00:00.000Z'),
  ('h_d00001', 'h_d00006', 3, '2026-10-20T12:00:00.000Z', '2026-10-20T12:00:00.000Z'),
  ('h_d00002', 'h_d00001', 1, '2026-10-20T12:05:00.000Z', '2026-10-20T12:05:00.000Z'),
  ('h_d00002', 'h_d00004', 2, '2026-10-20T12:05:00.000Z', '2026-10-20T12:05:00.000Z'),
  ('h_d00003', 'h_d00004', 1, '2026-10-20T12:10:00.000Z', '2026-10-20T12:10:00.000Z'),
  ('h_d00003', 'h_d00007', 2, '2026-10-20T12:10:00.000Z', '2026-10-20T12:10:00.000Z'),
  ('h_d00004', 'h_d00003', 1, '2026-10-20T12:15:00.000Z', '2026-10-20T12:15:00.000Z'),
  ('h_d00004', 'h_d00005', 2, '2026-10-20T12:15:00.000Z', '2026-10-20T12:15:00.000Z'),
  ('h_d00006', 'h_d00001', 1, '2026-10-20T12:20:00.000Z', '2026-10-20T12:20:00.000Z'),
  ('h_d00006', 'h_d00002', 2, '2026-10-20T12:20:00.000Z', '2026-10-20T12:20:00.000Z'),
  ('h_d00007', 'h_d00003', 1, '2026-10-20T12:25:00.000Z', '2026-10-20T12:25:00.000Z');
