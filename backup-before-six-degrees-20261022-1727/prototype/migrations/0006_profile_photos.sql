-- Profile photos (stored in R2 bucket pointmint-agents-photos, served at /media/photos/<photo_key>)
-- and the "no photo, ranked lower" rule. Members without a photo stay listed but sort below members with one,
-- and search_matches subtracts PHOTO_PENALTY (15 points) from matches whose counterpart has no photo.
ALTER TABLE humans ADD COLUMN photo_key TEXT;          -- random R2 key, NULL = no photo
ALTER TABLE humans ADD COLUMN photo_mime TEXT CHECK (photo_mime IS NULL OR photo_mime IN ('image/jpeg', 'image/webp'));
ALTER TABLE humans ADD COLUMN photo_bytes INTEGER;
ALTER TABLE humans ADD COLUMN photo_source TEXT CHECK (photo_source IS NULL OR photo_source IN ('camera', 'upload'));
ALTER TABLE humans ADD COLUMN photo_updated_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_humans_photo_key ON humans(photo_key) WHERE photo_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_humans_rank ON humans((photo_key IS NULL), is_demo, created_at);
