-- Three-way PM guide thread (human + own agent + platform AI).
-- Confidential: visibility = owner_own_agent_platform_only.
-- Separate from §35 private bot window (human↔own-agent only).
-- Never joined into public messages, activity feed, or Markdown.

CREATE TABLE IF NOT EXISTS guide_threads (
  id TEXT PRIMARY KEY,
  human_id TEXT NOT NULL UNIQUE REFERENCES humans(id),
  agent_id TEXT REFERENCES agents(id),
  kind TEXT NOT NULL DEFAULT 'guide_three_way'
    CHECK (kind = 'guide_three_way'),
  visibility TEXT NOT NULL DEFAULT 'owner_own_agent_platform_only'
    CHECK (visibility = 'owner_own_agent_platform_only'),
  own_agent_muted INTEGER NOT NULL DEFAULT 0
    CHECK (own_agent_muted IN (0, 1)),
  title TEXT NOT NULL DEFAULT 'Talk with PM',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_guide_threads_human ON guide_threads(human_id);
CREATE INDEX IF NOT EXISTS idx_guide_threads_agent ON guide_threads(agent_id);

CREATE TABLE IF NOT EXISTS guide_thread_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES guide_threads(id),
  speaker TEXT NOT NULL CHECK (speaker IN ('human', 'own_agent', 'platform')),
  sender_human_id TEXT REFERENCES humans(id),
  sender_agent_id TEXT REFERENCES agents(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_guide_msg_thread ON guide_thread_messages(thread_id, created_at);
