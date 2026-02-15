import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAlphaOnly(word: string): boolean {
  return /^[A-Z]+$/i.test(word);
}

function parseSurnames(): Map<string, string> {
  const filePath = resolve(__dirname, "../data/Names_2010Census.csv");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(1); // skip header

  const words = new Map<string, string>();
  for (const line of lines) {
    const name = line.split(",")[0]?.trim();
    if (name && name.length >= 4 && isAlphaOnly(name)) {
      words.set(name.toUpperCase(), "surname");
    }
  }
  console.log(`Parsed ${words.size} valid surnames`);
  return words;
}

function parseCities(): Map<string, string> {
  const filePath = resolve(__dirname, "../data/cities15000.txt");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const words = new Map<string, string>();
  for (const line of lines) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    const cityName = columns[1]?.trim();
    if (
      cityName &&
      !cityName.includes(" ") &&
      cityName.length >= 4 &&
      isAlphaOnly(cityName)
    ) {
      words.set(cityName.toUpperCase(), "city");
    }
  }
  console.log(`Parsed ${words.size} valid cities`);
  return words;
}

async function main() {
  const cities = parseCities();
  const surnames = parseSurnames();

  // Merge: cities take priority on overlap
  const merged = new Map<string, string>();
  for (const [word, cat] of surnames) {
    merged.set(word, cat);
  }
  for (const [word, cat] of cities) {
    merged.set(word, cat); // overwrites surname if overlap
  }

  console.log(`Total unique words: ${merged.size}`);

  // Clear existing data for a clean import
  console.log("Clearing existing proper_nouns...");
  const { error: deleteError } = await supabase
    .from("proper_nouns")
    .delete()
    .neq("id", 0); // delete all rows (Supabase requires a filter)
  if (deleteError) {
    console.error("Error clearing table:", deleteError);
    process.exit(1);
  }

  // Batch insert in chunks of 500
  const rows = Array.from(merged.entries()).map(([word, category]) => ({
    word,
    category,
  }));

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, status, statusText } = await supabase
      .from("proper_nouns")
      .insert(batch);

    if (error) {
      console.error(`Error at batch ${i} (${status} ${statusText}):`, error);
      process.exit(1);
    }
    inserted += batch.length;
    if (inserted % 5000 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`Inserted ${inserted}/${rows.length}`);
    }
  }

  console.log("Import complete!");
}

main();
