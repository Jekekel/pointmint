-- §40 Sequential user_number (early-adopter status signal)
-- Michael Lebor = User 001 (seeded). Isaac Schulman = 002, Yosef Birnboim = 003 (reserved until signup).
-- All other verified humans get the next number once, never renumbered.
-- No phones/secrets invented for missing founders.

ALTER TABLE humans ADD COLUMN user_number INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_humans_user_number
  ON humans(user_number) WHERE user_number IS NOT NULL;

-- Monotonic allocator; next_number is the next free auto-assign value (starts after reserved 1–3).
CREATE TABLE IF NOT EXISTS user_number_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_number INTEGER NOT NULL
);

-- Name-keyed reservations for founders not yet in D1 (Isaac, Yosef). Claimed on first matching verified signup.
CREATE TABLE IF NOT EXISTS user_number_reservations (
  name_norm TEXT PRIMARY KEY,
  user_number INTEGER NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  claimed_human_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Founder seeds / reservations (name_norm = lower(trim(collapse spaces)))
INSERT OR IGNORE INTO user_number_reservations (name_norm, user_number, display_name, claimed_human_id) VALUES
  ('michael lebor', 1, 'Michael Lebor', NULL),
  ('isaac schulman', 2, 'Isaac Schulman', NULL),
  ('yosef birnboim', 3, 'Yosef Birnboim', NULL);

-- Seed Michael Lebor = User 001 when the known live row exists
UPDATE humans
SET user_number = 1
WHERE id = 'h_8f0dd87584fc9f72a9'
  AND user_number IS NULL;

UPDATE user_number_reservations
SET claimed_human_id = 'h_8f0dd87584fc9f72a9'
WHERE name_norm = 'michael lebor'
  AND (claimed_human_id IS NULL OR claimed_human_id = '');

-- Also claim reservation if Michael appears under that exact normalized name with another id
UPDATE user_number_reservations
SET claimed_human_id = (
  SELECT id FROM humans
  WHERE lower(trim(replace(replace(replace(name, char(9), ' '), char(10), ' '), char(13), ' '))) = 'michael lebor'
    AND phone_verified_at IS NOT NULL
  ORDER BY created_at ASC LIMIT 1
)
WHERE name_norm = 'michael lebor'
  AND claimed_human_id IS NULL
  AND EXISTS (
    SELECT 1 FROM humans
    WHERE lower(trim(name)) = 'michael lebor' AND phone_verified_at IS NOT NULL
  );

UPDATE humans
SET user_number = 1
WHERE user_number IS NULL
  AND phone_verified_at IS NOT NULL
  AND lower(trim(name)) = 'michael lebor'
  AND NOT EXISTS (SELECT 1 FROM humans h2 WHERE h2.user_number = 1);

-- Backfill every other verified human chronologically → 004, 005, … (skip 1–3)
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           ORDER BY COALESCE(phone_verified_at, created_at) ASC, id ASC
         ) AS rn
  FROM humans
  WHERE phone_verified_at IS NOT NULL
    AND user_number IS NULL
)
UPDATE humans
SET user_number = (
  SELECT ordered.rn + 3 FROM ordered WHERE ordered.id = humans.id
)
WHERE id IN (SELECT id FROM ordered);

INSERT OR REPLACE INTO user_number_counter (id, next_number)
VALUES (1, COALESCE((SELECT MAX(user_number) FROM humans), 3) + 1);
