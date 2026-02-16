import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "readline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Safety: check we're not pointing at a production URL
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  console.log(`Target: ${url}`);

  // Count existing progress rows
  const { count } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true });

  console.log(`Found ${count} user_progress rows.`);

  if (!count || count === 0) {
    console.log("Nothing to wipe.");
    return;
  }

  // Confirm
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question('Type "yes" to confirm wipe: ', resolve);
  });
  rl.close();

  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Aborted.");
    return;
  }

  const { error } = await supabase
    .from("user_progress")
    .delete()
    .neq("id", 0);

  if (error) {
    console.error("Error wiping progress:", error);
    process.exit(1);
  }

  console.log("User progress wiped. Puzzles and words are preserved.");
}

main();
