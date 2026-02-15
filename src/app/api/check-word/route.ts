import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreWord } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { word, puzzle_id } = await request.json();

  if (!word || !puzzle_id) {
    return NextResponse.json(
      { error: "Missing word or puzzle_id" },
      { status: 400 }
    );
  }

  const upperWord = word.toUpperCase();

  // Get puzzle with valid_answers
  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("valid_answers, center_letter, outer_letters")
    .eq("id", puzzle_id)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  // Validate word
  if (!puzzle.valid_answers.includes(upperWord)) {
    // Determine why it's invalid for a helpful message
    if (upperWord.length < 4) {
      return NextResponse.json({ error: "Too short", valid: false });
    }
    if (!upperWord.includes(puzzle.center_letter)) {
      return NextResponse.json({ error: "Missing center letter", valid: false });
    }
    const allLetters = new Set([
      puzzle.center_letter,
      ...puzzle.outer_letters,
    ]);
    const hasInvalidLetter = upperWord
      .split("")
      .some((l: string) => !allLetters.has(l));
    if (hasInvalidLetter) {
      return NextResponse.json({ error: "Invalid letters", valid: false });
    }
    return NextResponse.json({ error: "Not a valid word", valid: false });
  }

  // Get current progress
  const { data: existing } = await supabase
    .from("user_progress")
    .select("id, found_words, score")
    .eq("user_id", user.id)
    .eq("puzzle_id", puzzle_id)
    .single();

  if (existing && existing.found_words.includes(upperWord)) {
    return NextResponse.json({ error: "Already found", valid: false });
  }

  const allLetters = [puzzle.center_letter, ...puzzle.outer_letters];
  const wordScore = scoreWord(upperWord, allLetters);
  const newFoundWords = [...(existing?.found_words || []), upperWord];
  const newScore = (existing?.score || 0) + wordScore;

  if (existing) {
    await supabase
      .from("user_progress")
      .update({
        found_words: newFoundWords,
        score: newScore,
        last_updated: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_progress").insert({
      user_id: user.id,
      puzzle_id,
      found_words: newFoundWords,
      score: newScore,
    });
  }

  return NextResponse.json({
    valid: true,
    word: upperWord,
    score: wordScore,
    totalScore: newScore,
    foundWords: newFoundWords,
  });
}
