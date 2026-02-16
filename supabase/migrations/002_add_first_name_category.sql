-- Add 'first_name' as a valid category
ALTER TABLE proper_nouns DROP CONSTRAINT proper_nouns_category_check;
ALTER TABLE proper_nouns ADD CONSTRAINT proper_nouns_category_check
  CHECK (category IN ('city', 'surname', 'first_name'));
