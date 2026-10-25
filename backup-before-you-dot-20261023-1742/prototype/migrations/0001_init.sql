-- PointMint Agent Network prototype schema
CREATE TABLE IF NOT EXISTS humans (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL UNIQUE,           -- one human per phone number
  name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',          -- only revealed after both humans approve an intro
  is_demo INTEGER NOT NULL DEFAULT 0,
  phone_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL,                   -- SHA-256(pepper:id:code); plaintext never stored
  expires_at INTEGER NOT NULL,               -- unix seconds
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_requests(phone_e164);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  human_id TEXT NOT NULL REFERENCES humans(id),
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  human_id TEXT NOT NULL UNIQUE REFERENCES humans(id),   -- exactly ONE agent per human
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('Claude','Grok','ChatGPT','Other')),
  bio TEXT NOT NULL DEFAULT '',
  credential_hash TEXT UNIQUE,               -- SHA-256 of pm_agent_ token; NULL = no active credential
  credential_prefix TEXT,                    -- first chars for display only
  credential_created_at TEXT,
  revoked_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS vault_items (
  id TEXT PRIMARY KEY,
  human_id TEXT NOT NULL REFERENCES humans(id),
  type TEXT NOT NULL CHECK (type IN ('buy','sell','seek','acquire')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',             -- comma-separated, lowercase
  budget_min INTEGER,
  budget_max INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','network','private')),
  created_by TEXT NOT NULL DEFAULT 'human' CHECK (created_by IN ('human','agent')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_vault_human ON vault_items(human_id);

CREATE TABLE IF NOT EXISTS intros (
  id TEXT PRIMARY KEY,
  from_human_id TEXT NOT NULL REFERENCES humans(id),
  from_agent_id TEXT REFERENCES agents(id),
  to_human_id TEXT NOT NULL REFERENCES humans(id),
  to_agent_id TEXT REFERENCES agents(id),
  proposed_by TEXT NOT NULL CHECK (proposed_by IN ('human','agent')),
  reason TEXT NOT NULL,
  from_item_id TEXT,
  to_item_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending_human_approval','pending_recipient','accepted','declined','rejected_by_sender')),
  sender_approved_at TEXT,
  recipient_decided_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (from_human_id <> to_human_id)
);
CREATE INDEX IF NOT EXISTS idx_intros_from ON intros(from_human_id);
CREATE INDEX IF NOT EXISTS idx_intros_to ON intros(to_human_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  intro_id TEXT NOT NULL REFERENCES intros(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('human','agent')),
  sender_human_id TEXT NOT NULL REFERENCES humans(id),  -- the human (or the human the agent acts for)
  sender_agent_id TEXT REFERENCES agents(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_intro ON messages(intro_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  human_id TEXT,
  agent_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human','agent','system')),
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_human ON audit_log(human_id, id);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
