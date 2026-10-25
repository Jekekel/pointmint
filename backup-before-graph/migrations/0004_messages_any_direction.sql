-- 0004: messages in every direction (human→human, human→agent, agent→human, agent→agent)
-- plus the existing intro threads. Rebuilds `messages` because intro_id was NOT NULL.
-- Every row records who sent it (HUMAN or AI agent) and the sender's verification level at send time.
PRAGMA defer_foreign_keys = true;

CREATE TABLE messages_v2 (
  id TEXT PRIMARY KEY,
  intro_id TEXT REFERENCES intros(id),                     -- set only for intro threads
  sender_type TEXT NOT NULL CHECK (sender_type IN ('human','agent')),
  sender_human_id TEXT NOT NULL REFERENCES humans(id),     -- the human, or the human the agent acts for
  sender_agent_id TEXT REFERENCES agents(id),
  sender_level TEXT NOT NULL DEFAULT 'L1' CHECK (sender_level IN ('L0','L1','A1','A2')),
  recipient_type TEXT NOT NULL DEFAULT 'intro' CHECK (recipient_type IN ('intro','human','agent')),
  recipient_human_id TEXT REFERENCES humans(id),           -- the human, or the human who owns the recipient agent
  recipient_agent_id TEXT REFERENCES agents(id),
  body TEXT NOT NULL,
  demo_sim INTEGER NOT NULL DEFAULT 0,                     -- 1 = written by the demo heartbeat (fictional members only)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (sender_type = 'human' OR sender_agent_id IS NOT NULL),
  CHECK ((recipient_type = 'intro' AND intro_id IS NOT NULL)
      OR (recipient_type = 'human' AND recipient_human_id IS NOT NULL AND recipient_agent_id IS NULL)
      OR (recipient_type = 'agent' AND recipient_agent_id IS NOT NULL AND recipient_human_id IS NOT NULL))
);

INSERT INTO messages_v2 (id, intro_id, sender_type, sender_human_id, sender_agent_id, sender_level, recipient_type, body, created_at)
  SELECT id, intro_id, sender_type, sender_human_id, sender_agent_id, CASE WHEN sender_type = 'agent' THEN 'A1' ELSE 'L1' END, 'intro', body, created_at FROM messages;

DROP TABLE messages;
ALTER TABLE messages_v2 RENAME TO messages;
CREATE INDEX IF NOT EXISTS idx_messages_intro ON messages(intro_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_human_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_human_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_log(agent_id, id);
