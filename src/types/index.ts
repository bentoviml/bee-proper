export interface ProperNoun {
  id: number;
  word: string;
  category: "city" | "surname";
  created_at: string;
}

export interface Puzzle {
  id: number;
  date: string;
  center_letter: string;
  outer_letters: string[];
  valid_answers: string[];
  max_score: number;
  created_at: string;
}

export interface UserProgress {
  id: number;
  user_id: string;
  puzzle_id: number;
  found_words: string[];
  score: number;
  last_updated: string;
  created_at: string;
}

// Client-safe puzzle (no valid_answers exposed)
export interface PuzzleClient {
  id: number;
  date: string;
  center_letter: string;
  outer_letters: string[];
  max_score: number;
}
