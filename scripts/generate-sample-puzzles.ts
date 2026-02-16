import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Configuration ---
const PUZZLE_COUNT = 90; // number of puzzles to generate
const MIN_WORDS = 15;
const MAX_WORDS = 100;
const MAX_ATTEMPTS = 50000;
const CANDIDATE_POOL = 20; // top N frequent letters to sample from

function scoreWord(word: string, allLetters: string[]): number {
  if (word.length === 4) return 1;
  const wordLetters = new Set(word.split(""));
  const isPangram = allLetters.every((l) => wordLetters.has(l));
  return isPangram ? word.length + 7 : word.length;
}

async function fetchAllWords(): Promise<string[]> {
  const { count } = await supabase
    .from("proper_nouns")
    .select("*", { count: "exact", head: true });

  console.log(`Total rows in DB: ${count}`);

  const allWords: string[] = [];
  let lastId = 0;

  while (true) {
    const { data, error } = await supabase
      .from("proper_nouns")
      .select("id, word")
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("Error fetching words:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allWords.push(...data.map((n) => n.word));
    lastId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  return allWords;
}

async function main() {
  const args = process.argv.slice(2);
  const puzzleCount = args.includes("--count")
    ? parseInt(args[args.indexOf("--count") + 1], 10)
    : PUZZLE_COUNT;
  const startDateArg = args.includes("--start-date")
    ? args[args.indexOf("--start-date") + 1]
    : null;

  const allWords = await fetchAllWords();
  console.log(`Loaded ${allWords.length} words`);

  if (allWords.length === 0) {
    console.error("No words in database! Run import-word-data.ts first.");
    process.exit(1);
  }

  // Build letter frequency map
  const letterFreq = new Map<string, number>();
  for (const word of allWords) {
    const unique = new Set(word.split(""));
    for (const l of unique) {
      letterFreq.set(l, (letterFreq.get(l) || 0) + 1);
    }
  }

  const sortedLetters = Array.from(letterFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);

  console.log(`Top letters: ${sortedLetters.slice(0, 15).join(", ")}`);
  console.log(`Generating ${puzzleCount} puzzles...\n`);

  const candidateLetters = sortedLetters.slice(0, CANDIDATE_POOL);

  const puzzles: {
    date: string;
    center_letter: string;
    outer_letters: string[];
    valid_answers: string[];
    max_score: number;
  }[] = [];

  const usedLetterSets = new Set<string>();
  const startDate = startDateArg ? new Date(startDateArg + "T00:00:00") : new Date();
  let rejected = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && puzzles.length < puzzleCount; attempt++) {
    const shuffled = [...candidateLetters].sort(() => Math.random() - 0.5);
    const seven = shuffled.slice(0, 7);
    const key = [...seven].sort().join("");
    if (usedLetterSets.has(key)) continue;
    usedLetterSets.add(key);

    const letterSet = new Set(seven);

    // Find all valid words for this letter set
    const matchingWords = allWords.filter((word) =>
      word.split("").every((l) => letterSet.has(l))
    );

    for (const center of seven) {
      const validAnswers = matchingWords.filter((word) =>
        word.includes(center)
      );

      // Quality checks
      if (validAnswers.length < MIN_WORDS) continue;
      if (validAnswers.length > MAX_WORDS) continue;

      // Must have at least one pangram
      const pangrams = validAnswers.filter((w) => {
        const wLetters = new Set(w.split(""));
        return seven.every((l) => wLetters.has(l));
      });
      if (pangrams.length < 1) continue;

      const outer = seven.filter((l) => l !== center);
      const maxScore = validAnswers.reduce(
        (sum, w) => sum + scoreWord(w, seven),
        0
      );

      const date = new Date(startDate);
      date.setDate(date.getDate() + puzzles.length);
      const dateStr = date.toISOString().split("T")[0];

      puzzles.push({
        date: dateStr,
        center_letter: center,
        outer_letters: outer,
        valid_answers: validAnswers,
        max_score: maxScore,
      });

      console.log(
        `#${puzzles.length} (${dateStr}): ${center}+[${outer.join(",")}] — ${validAnswers.length} words, ${pangrams.length} pangram(s), max ${maxScore} pts`
      );
      break; // next letter set
    }
  }

  // Summary
  console.log(`\n--- Summary ---`);
  console.log(`Generated: ${puzzles.length}/${puzzleCount}`);
  console.log(`Letter sets tried: ${usedLetterSets.size}`);

  if (puzzles.length === 0) {
    console.error("Could not generate any puzzles! Try adjusting parameters.");
    process.exit(1);
  }

  const wordCounts = puzzles.map((p) => p.valid_answers.length);
  console.log(`Word count range: ${Math.min(...wordCounts)}-${Math.max(...wordCounts)}`);
  console.log(`Avg words per puzzle: ${(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length).toFixed(1)}`);

  // Upsert puzzles (overwrite existing dates)
  const { error: insertError } = await supabase
    .from("puzzles")
    .upsert(puzzles, { onConflict: "date" });

  if (insertError) {
    console.error("Error inserting puzzles:", insertError);
    process.exit(1);
  }

  console.log(`\nSaved ${puzzles.length} puzzles to database!`);
  console.log(`Date range: ${puzzles[0].date} to ${puzzles[puzzles.length - 1].date}`);
}

main();
