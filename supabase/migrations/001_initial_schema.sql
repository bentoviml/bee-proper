-- Proper nouns word list
CREATE TABLE proper_nouns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('city', 'surname')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proper_nouns_word ON proper_nouns (word);

-- Daily puzzles
CREATE TABLE puzzles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  center_letter CHAR(1) NOT NULL,
  outer_letters CHAR(1)[] NOT NULL,
  valid_answers TEXT[] NOT NULL,
  max_score INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_puzzles_date ON puzzles (date);

-- User progress per puzzle
CREATE TABLE user_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id BIGINT NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  found_words TEXT[] NOT NULL DEFAULT '{}',
  score INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, puzzle_id)
);

CREATE INDEX idx_user_progress_user_puzzle ON user_progress (user_id, puzzle_id);

-- RLS policies
ALTER TABLE proper_nouns ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- proper_nouns: only service role can access (used by scripts)
-- No policies = no access for anon/authenticated, only service role bypasses RLS

-- puzzles: authenticated users can read
CREATE POLICY "Authenticated users can read puzzles"
  ON puzzles FOR SELECT
  TO authenticated
  USING (true);

-- user_progress: users can read/write their own rows
CREATE POLICY "Users can read own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
