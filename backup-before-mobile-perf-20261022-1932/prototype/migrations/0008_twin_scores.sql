-- Digital Twin Score cache (0–100): how faithfully a human's agent represents them. Recomputed when the
-- human's audit trail moves (cursor), so every relevant event refreshes it. Only human-confirmed actions count.
CREATE TABLE twin_scores (
  human_id TEXT PRIMARY KEY REFERENCES humans(id) ON DELETE CASCADE,
  total INTEGER NOT NULL CHECK (total BETWEEN 0 AND 100),
  components TEXT NOT NULL,          -- JSON array of {key,label,points,max,detail,tip}
  cursor TEXT NOT NULL,              -- staleness key (latest audit id + intro outcomes)
  computed_at TEXT NOT NULL
);
CREATE INDEX idx_twin_total ON twin_scores(total);
