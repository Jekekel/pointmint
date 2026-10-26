-- Private owner↔own-agent confidential dialogue (v1).
-- Separate tables: never joined into public messages, activity, feed, or Markdown.
-- visibility is always owner_agent_only; kind private_owner_agent = confidential strategy thread.
CREATE TABLE IF NOT EXISTS private_workspaces (
  id TEXT PRIMARY KEY,
  human_id TEXT NOT NULL UNIQUE REFERENCES humans(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  kind TEXT NOT NULL DEFAULT 'private_owner_agent'
    CHECK (kind IN ('private_owner_agent', 'confidential_dialogue')),
  visibility TEXT NOT NULL DEFAULT 'owner_agent_only'
    CHECK (visibility = 'owner_agent_only'),
  title TEXT NOT NULL DEFAULT 'Private with Mel',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_priv_ws_human ON private_workspaces(human_id);
CREATE INDEX IF NOT EXISTS idx_priv_ws_agent ON private_workspaces(agent_id);

CREATE TABLE IF NOT EXISTS private_workspace_messages (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES private_workspaces(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('human','agent')),
  sender_human_id TEXT NOT NULL REFERENCES humans(id),
  sender_agent_id TEXT REFERENCES agents(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_priv_msg_ws ON private_workspace_messages(workspace_id, created_at);
