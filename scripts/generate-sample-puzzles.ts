import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function scoreWord(word: string, allLetters: string[]): number {
  if (word.length === 4) return 1;
  const wordLetters = new Set(word.split(""));
  const isPangram = allLetters.every((l) => wordLetters.has(l));
  return isPangram ? word.length + 7 : word.length;
}

async function fetchAllWords(): Promise<string[]> {
  // Get total count first
  const { count } = await supabase
    .from("proper_nouns")
    .select("*", { count: "exact", head: true });

  console.log(`Total rows in DB: ${count}`);

  // Fetch in pages using cursor-based pagination (id ordering)
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
  const allWords = await fetchAllWords();
  console.log(`Loaded ${allWords.length} words`);

  // Sanity checks
  const hasRome = allWords.includes("ROME");
  console.log(hasRome ? "✓ ROME found in word list" : "✗ ROME NOT found");

  // Build a set for fast lookup, and index words by their letter sets
  const wordSet = new Set(allWords);

  // Build letter frequency map to pick common letters
  const letterFreq = new Map<string, number>();
  for (const word of allWords) {
    const unique = new Set(word.split(""));
    for (const l of unique) {
      letterFreq.set(l, (letterFreq.get(l) || 0) + 1);
    }
  }

  // Sort letters by frequency
  const sortedLetters = Array.from(letterFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);

  console.log("Top letters by frequency:", sortedLetters.slice(0, 15).join(", "));

  const puzzles: {
    date: string;
    center_letter: string;
    outer_letters: string[];
    valid_answers: string[];
    max_score: number;
  }[] = [];

  const usedLetterSets = new Set<string>();
  const today = new Date();

  // Use top 20 most frequent letters as candidates
  const candidateLetters = sortedLetters.slice(0, 20);

  for (let attempt = 0; attempt < 10000 && puzzles.length < 5; attempt++) {
    // Pick 7 random letters from candidates
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

    // Try each letter as center
    for (const center of seven) {
      const validAnswers = matchingWords.filter((word) =>
        word.includes(center)
      );

      // Require at least one pangram (word using all 7 letters)
      const pangrams = validAnswers.filter((w) => {
        const wLetters = new Set(w.split(""));
        return seven.every((l) => wLetters.has(l));
      });

      if (validAnswers.length >= 15 && validAnswers.length <= 50 && pangrams.length >= 1) {
        const outer = seven.filter((l) => l !== center);
        const maxScore = validAnswers.reduce(
          (sum, w) => sum + scoreWord(w, seven),
          0
        );

        const date = new Date(today);
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
          `Puzzle ${puzzles.length}: ${center} + [${outer.join(",")}] — ${validAnswers.length} words, ${pangrams.length} pangram(s), max score ${maxScore}`
        );
        console.log(`  Pangrams: ${pangrams.join(", ")}`);
        console.log(`  Sample answers: ${validAnswers.slice(0, 10).join(", ")}`);
        break;
      }
    }
  }

  if (puzzles.length === 0) {
    console.error("Could not generate any puzzles! Try adjusting parameters.");
    process.exit(1);
  }

  // Insert puzzles
  const { error: insertError } = await supabase
    .from("puzzles")
    .upsert(puzzles, { onConflict: "date" });

  if (insertError) {
    console.error("Error inserting puzzles:", insertError);
    process.exit(1);
  }

  console.log(`\nGenerated ${puzzles.length} puzzles!`);
}

main();
