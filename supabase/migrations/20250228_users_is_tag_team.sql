-- Add registration type: solo vs tag-team
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_tag_team BOOLEAN NOT NULL DEFAULT false;
