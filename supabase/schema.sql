-- Fitness Leaderboard Schema
-- Run this in the Supabase SQL Editor to create tables, function, and trigger.
-- After running, you can drop the old `leaderboard` and `account` tables if they exist.

-- Users (username-only auth; is_tag_team = true when registered as Tag-Team; has_slack_linked from slack_user_links)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  is_tag_team BOOLEAN NOT NULL DEFAULT false,
  has_slack_linked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiple Slack accounts can link to the same leaderboard user (e.g. tag teams)
CREATE TABLE IF NOT EXISTS slack_user_links (
  slack_user_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_slack_user_links_user_id ON slack_user_links(user_id);

-- One-time codes for Connect Slack flow (web creates code, user runs /link <code> in Slack)
CREATE TABLE IF NOT EXISTS slack_link_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Keep users.has_slack_linked in sync when slack_user_links changes (e.g. tag teams: multiple Slack IDs per user)
CREATE OR REPLACE FUNCTION sync_has_slack_linked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE uid UUID;
BEGIN
  uid := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
  UPDATE users SET has_slack_linked = (SELECT count(*) > 0 FROM slack_user_links WHERE user_id = uid) WHERE id = uid;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trigger_sync_has_slack_linked ON slack_user_links;
CREATE TRIGGER trigger_sync_has_slack_linked
  AFTER INSERT OR DELETE ON slack_user_links FOR EACH ROW EXECUTE FUNCTION sync_has_slack_linked();

-- Star types (yellow, blue, red; point values and optional day-of-week availability)
-- available_on_dow: array of 0-6 (Sunday=0, Saturday=6); NULL or empty = available every day
-- max_per_day: cap on count per day (e.g. yellow=6, others=1)
CREATE TABLE IF NOT EXISTS star_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  point_value NUMERIC NOT NULL DEFAULT 5,
  max_per_day INT NOT NULL DEFAULT 1,
  available_on_dow INT[] DEFAULT NULL
);

-- One row per user per date per star type; quantity = 0-6 for yellow, 0 or 1 for others
CREATE TABLE IF NOT EXISTS daily_star_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  star_type_id UUID NOT NULL REFERENCES star_types(id) ON DELETE CASCADE,
  checked BOOLEAN NOT NULL DEFAULT false,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE (user_id, date, star_type_id)
);

-- Cached total score per user (updated by trigger)
CREATE TABLE IF NOT EXISTS user_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_score NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard and date lookups
CREATE INDEX IF NOT EXISTS idx_daily_star_entries_user_date ON daily_star_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_scores_total ON user_scores(total_score DESC);

-- Function: compute total score (5 pts per star; yellow capped at 6/day, others at 1/day)
CREATE OR REPLACE FUNCTION compute_user_score(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(
    LEAST(d.quantity, COALESCE(st.max_per_day, 1)) * st.point_value
  ), 0) INTO total
  FROM daily_star_entries d
  JOIN star_types st ON st.id = d.star_type_id
  WHERE d.user_id = p_user_id
    AND d.quantity > 0
    AND (
      st.available_on_dow IS NULL
      OR array_length(st.available_on_dow, 1) IS NULL
      OR EXTRACT(DOW FROM d.date)::INT = ANY(st.available_on_dow)
    );
  RETURN total;
END;
$$;

-- Function: upsert user_scores for a user after daily_star_entries change
CREATE OR REPLACE FUNCTION refresh_user_score()
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
  INSERT INTO user_scores (user_id, total_score, updated_at)
  VALUES (uid, compute_user_score(uid), NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET total_score = EXCLUDED.total_score, updated_at = EXCLUDED.updated_at;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on daily_star_entries
DROP TRIGGER IF EXISTS trigger_refresh_user_score ON daily_star_entries;
CREATE TRIGGER trigger_refresh_user_score
  AFTER INSERT OR UPDATE OR DELETE ON daily_star_entries
  FOR EACH ROW
  EXECUTE FUNCTION refresh_user_score();

-- Ensure new users get a user_scores row (so they appear on leaderboard with 0)
CREATE OR REPLACE FUNCTION create_user_score_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_scores (user_id, total_score, updated_at)
  VALUES (NEW.id, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_create_user_score_on_signup ON users;
CREATE TRIGGER trigger_create_user_score_on_signup
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_score_on_signup();

-- Seed star types: 5 pts per star; yellow max 6/day, blue weekdays only
INSERT INTO star_types (name, display_order, point_value, max_per_day, available_on_dow)
VALUES
  ('yellow', 1, 5, 6, NULL),
  ('blue', 2, 5, 1, ARRAY[1,2,3,4,5]),
  ('red', 3, 5, 1, NULL)
ON CONFLICT (name) DO UPDATE SET
  point_value = EXCLUDED.point_value,
  max_per_day = EXCLUDED.max_per_day,
  available_on_dow = EXCLUDED.available_on_dow;

-- Optional: RLS (Row Level Security). For first version with anon key, you may allow all.
-- Uncomment and adjust when you have proper auth (e.g. user_id from session).
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE star_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_star_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
-- CREATE POLICY "Anyone can read star_types" ON star_types FOR SELECT USING (true);
-- CREATE POLICY "Anyone can read user_scores" ON user_scores FOR SELECT USING (true);
-- CREATE POLICY "Users can manage own daily_star_entries" ON daily_star_entries FOR ALL USING (auth.uid() = user_id);
