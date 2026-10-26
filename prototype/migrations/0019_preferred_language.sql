-- §39 Multilingual / real-time translation (phase 1)
-- BCP-47 language preference per human; optional on-read translation cache.
-- No API keys in this migration. TRANSLATE_PROVIDER env selects the Worker stub/provider.

ALTER TABLE humans ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS message_translations (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  target_lang TEXT NOT NULL,
  source_lang TEXT,
  translated_body TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'stub',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'unavailable', 'error')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (message_id, target_lang)
);
CREATE INDEX IF NOT EXISTS idx_msg_tr_message ON message_translations(message_id);
CREATE INDEX IF NOT EXISTS idx_humans_lang ON humans(preferred_language);
