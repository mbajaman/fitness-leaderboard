-- Fitness Leaderboard Schema
-- Run this in the Supabase SQL Editor to create tables, function, and trigger.
-- After running, you can drop the old `leaderboard` and `account` tables if they exist.

-- Users (username-only auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Star types (yellow, blue, red, green; point values and optional day-of-week availability)
-- available_on_dow: array of 0-6 (Sunday=0, Saturday=6); NULL or empty = available every day
CREATE TABLE IF NOT EXISTS star_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  point_value NUMERIC NOT NULL DEFAULT 1,
  available_on_dow INT[] DEFAULT NULL
);

-- One row per user per date per star type
CREATE TABLE IF NOT EXISTS daily_star_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  star_type_id UUID NOT NULL REFERENCES star_types(id) ON DELETE CASCADE,
  checked BOOLEAN NOT NULL DEFAULT false,
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

-- Function: compute total score for a user (only counts entries where star was available that day)
CREATE OR REPLACE FUNCTION compute_user_score(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total NUMERIC := 0;
BEGIN
  SELECT COALESCE(SUM(st.point_value), 0) INTO total
  FROM daily_star_entries d
  JOIN star_types st ON st.id = d.star_type_id
  WHERE d.user_id = p_user_id
    AND d.checked = true
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

-- Seed star types (yellow, blue, red, green); adjust point_value and available_on_dow as needed
INSERT INTO star_types (name, display_order, point_value, available_on_dow)
VALUES
  ('yellow', 1, 1, NULL),
  ('blue', 2, 1, NULL),
  ('red', 3, 1, NULL),
  ('green', 4, 1, NULL)
ON CONFLICT (name) DO NOTHING;

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
