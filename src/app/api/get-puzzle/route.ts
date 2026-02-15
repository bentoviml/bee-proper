import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayUTC } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayUTC();

  // Get today's puzzle
  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, date, center_letter, outer_letters, max_score")
    .eq("date", today)
    .single();

  if (puzzleError || !puzzle) {
    // Fallback: get the most recent puzzle
    const { data: fallback, error: fallbackError } = await supabase
      .from("puzzles")
      .select("id, date, center_letter, outer_letters, max_score")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (fallbackError || !fallback) {
      return NextResponse.json(
        { error: "No puzzle available" },
        { status: 404 }
      );
    }

    // Get user progress for this puzzle
    const { data: progress } = await supabase
      .from("user_progress")
      .select("found_words, score")
      .eq("user_id", user.id)
      .eq("puzzle_id", fallback.id)
      .single();

    return NextResponse.json({
      puzzle: fallback,
      progress: progress || { found_words: [], score: 0 },
    });
  }

  // Get user progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("found_words, score")
    .eq("user_id", user.id)
    .eq("puzzle_id", puzzle.id)
    .single();

  return NextResponse.json({
    puzzle,
    progress: progress || { found_words: [], score: 0 },
  });
}
