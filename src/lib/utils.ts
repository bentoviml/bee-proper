/** Convert UPPERCASE word to Title Case for display */
export function toTitleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Calculate score for a word */
export function scoreWord(word: string, puzzleLetters: string[]): number {
  if (word.length === 4) return 1;
  const wordLetters = new Set(word.toUpperCase().split(""));
  const isPangram = puzzleLetters.every((l) => wordLetters.has(l.toUpperCase()));
  const base = word.length;
  return isPangram ? base + 7 : base;
}

/** Check if a word is a pangram (uses all 7 letters) */
export function isPangram(word: string, puzzleLetters: string[]): boolean {
  const wordLetters = new Set(word.toUpperCase().split(""));
  return puzzleLetters.every((l) => wordLetters.has(l.toUpperCase()));
}

/** Get today's date as YYYY-MM-DD in America/New_York timezone */
export function getTodayET(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA locale gives YYYY-MM-DD format
}
