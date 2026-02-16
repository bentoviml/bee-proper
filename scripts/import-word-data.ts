import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SURNAME_LIMIT = 5000;
const FIRST_NAME_LIMIT = 5000;

function isAlphaOnly(word: string): boolean {
  return /^[A-Z]+$/i.test(word);
}

function parseSurnames(): Map<string, string> {
  const filePath = resolve(__dirname, "../data/Names_2010Census.csv");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(1); // skip header

  // File is already sorted by rank (column index 1), so just take the first N valid
  const words = new Map<string, string>();
  for (const line of lines) {
    if (words.size >= SURNAME_LIMIT) break;
    const name = line.split(",")[0]?.trim();
    if (name && name.length >= 4 && isAlphaOnly(name)) {
      words.set(name.toUpperCase(), "surname");
    }
  }
  console.log(`Parsed ${words.size} surnames (top ${SURNAME_LIMIT})`);
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

function parseFirstNames(): Map<string, string> {
  const dir = resolve(__dirname, "../data/ssa-names");
  const files = readdirSync(dir).filter((f) => f.startsWith("yob") && f.endsWith(".txt"));

  console.log(`Found ${files.length} SSA year files`);

  // Aggregate counts across all years
  const counts = new Map<string, number>();
  for (const file of files) {
    const content = readFileSync(resolve(dir, file), "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim()) continue;
      const parts = line.split(",");
      const name = parts[0]?.trim();
      const count = parseInt(parts[2]?.trim() || "0", 10);
      if (name && count > 0) {
        const upper = name.toUpperCase();
        counts.set(upper, (counts.get(upper) || 0) + count);
      }
    }
  }

  // Sort by count descending, take top N that pass filters
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1]);

  const words = new Map<string, string>();
  for (const [name] of sorted) {
    if (words.size >= FIRST_NAME_LIMIT) break;
    if (name.length >= 4 && isAlphaOnly(name)) {
      words.set(name, "first_name");
    }
  }
  console.log(`Parsed ${words.size} first names (top ${FIRST_NAME_LIMIT} from ${counts.size} unique)`);
  return words;
}

async function main() {
  const cities = parseCities();
  const surnames = parseSurnames();
  const firstNames = parseFirstNames();

  // Merge: cities > first_names > surnames (priority order for overlaps)
  const merged = new Map<string, string>();
  for (const [word, cat] of surnames) {
    merged.set(word, cat);
  }
  for (const [word, cat] of firstNames) {
    merged.set(word, cat);
  }
  for (const [word, cat] of cities) {
    merged.set(word, cat);
  }

  // Count by category
  const catCounts = { city: 0, surname: 0, first_name: 0 };
  for (const cat of merged.values()) {
    catCounts[cat as keyof typeof catCounts]++;
  }
  console.log(`\nTotal unique words: ${merged.size}`);
  console.log(`  Cities: ${catCounts.city}`);
  console.log(`  Surnames: ${catCounts.surname}`);
  console.log(`  First names: ${catCounts.first_name}`);

  // Clear existing data for a clean import
  console.log("\nClearing existing proper_nouns...");
  const { error: deleteError } = await supabase
    .from("proper_nouns")
    .delete()
    .neq("id", 0);
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

  console.log("\nImport complete!");
}

main();
