-- Migration: Star quantity, max_per_day, and updated score calculation (5 pts per star, yellow max 6)
-- Run this in the Supabase SQL Editor.

-- 1. Add quantity to daily_star_entries (0-6 for yellow, 0 or 1 for others)
ALTER TABLE daily_star_entries
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

-- Backfill: existing rows get quantity 0 where checked = false, 1 where checked = true
UPDATE daily_star_entries
SET quantity = CASE WHEN checked THEN 1 ELSE 0 END;

-- 2. Add max_per_day to star_types (yellow = 6, others = 1)
ALTER TABLE star_types
  ADD COLUMN IF NOT EXISTS max_per_day INT NOT NULL DEFAULT 1;

UPDATE star_types SET max_per_day = 6 WHERE name = 'yellow';
UPDATE star_types SET point_value = 5;
UPDATE star_types SET available_on_dow = ARRAY[1,2,3,4,5] WHERE name = 'blue';

-- 3. Replace compute_user_score: LEAST(quantity, max_per_day) * point_value, with day-of-week filter
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

-- 4. Refresh all user_scores so existing data matches the new rules
UPDATE user_scores us
SET total_score = compute_user_score(us.user_id),
    updated_at = NOW();
