-- Private launch screen (/launch): history of server-side launch checks
CREATE TABLE IF NOT EXISTS launch_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  verdict TEXT NOT NULL CHECK (verdict IN ('GO','NO-GO')),
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  warned INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  results TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_launch_runs_created ON launch_runs(created_at);
