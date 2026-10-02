-- Phase 3: quotation title + a small key/value table for runtime state (e.g. when staff were last active in chat).
ALTER TABLE quotes ADD COLUMN title TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_last ON chat_conversations (last_message_at);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status, id);
