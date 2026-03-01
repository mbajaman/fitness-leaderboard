-- Tag-team support: multiple Slack users can link to the same leaderboard user.
-- Replaces single users.slack_user_id with a mapping table and has_slack_linked flag.

-- Mapping: one Slack user ID -> one leaderboard user; one leaderboard user can have many Slack IDs
CREATE TABLE IF NOT EXISTS slack_user_links (
  slack_user_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_slack_user_links_user_id ON slack_user_links(user_id);

-- Migrate existing links from users.slack_user_id
INSERT INTO slack_user_links (slack_user_id, user_id)
SELECT slack_user_id, id FROM users WHERE slack_user_id IS NOT NULL
ON CONFLICT (slack_user_id) DO NOTHING;

-- Add flag so app can show "Slack connected" without querying slack_user_links
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_slack_linked BOOLEAN NOT NULL DEFAULT false;

UPDATE users u
SET has_slack_linked = true
WHERE EXISTS (SELECT 1 FROM slack_user_links s WHERE s.user_id = u.id);

-- Trigger: keep has_slack_linked in sync when slack_user_links changes
CREATE OR REPLACE FUNCTION sync_has_slack_linked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    uid := OLD.user_id;
  ELSE
    uid := NEW.user_id;
  END IF;
  UPDATE users
  SET has_slack_linked = (SELECT count(*) > 0 FROM slack_user_links WHERE user_id = uid)
  WHERE id = uid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_has_slack_linked ON slack_user_links;
CREATE TRIGGER trigger_sync_has_slack_linked
  AFTER INSERT OR DELETE ON slack_user_links
  FOR EACH ROW
  EXECUTE FUNCTION sync_has_slack_linked();

-- Drop old single-link column and index
DROP INDEX IF EXISTS idx_users_slack_user_id;
ALTER TABLE users DROP COLUMN IF EXISTS slack_user_id;
