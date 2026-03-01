-- Slack bot: link Slack user ID to leaderboard user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_slack_user_id ON users(slack_user_id) WHERE slack_user_id IS NOT NULL;

-- One-time codes for "Connect Slack" flow (web app creates, user enters in /link)
CREATE TABLE IF NOT EXISTS slack_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_slack_link_codes_expires ON slack_link_codes(expires_at);
