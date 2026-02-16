"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import GameBoard from "@/components/GameBoard";
import ScoreDisplay from "@/components/ScoreDisplay";
import FoundWords from "@/components/FoundWords";
import HowToPlay from "@/components/HowToPlay";
import type { PuzzleClient } from "@/types";

export default function Home() {
  const [puzzle, setPuzzle] = useState<PuzzleClient | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/get-puzzle")
      .then((res) => res.json())
      .then((data) => {
        if (data.puzzle) {
          setPuzzle(data.puzzle);
          setFoundWords(data.progress?.found_words || []);
          setScore(data.progress?.score || 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = useCallback(
    async (word: string) => {
      if (!puzzle) return;

      setMessage("");
      setIsError(false);

      const res = await fetch("/api/check-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.toUpperCase(), puzzle_id: puzzle.id }),
      });

      const data = await res.json();

      if (data.valid) {
        setFoundWords(data.foundWords);
        setScore(data.totalScore);
        setIsError(false);
        setMessage(`+${data.score} points!`);
      } else {
        setIsError(true);
        setMessage(data.error || "Not a valid word");
      }

      setTimeout(() => {
        setMessage("");
        setIsError(false);
      }, 2000);
    },
    [puzzle]
  );

  return (
    <AuthGuard>
      <main className="min-h-screen bg-neutral-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-bold text-center mb-1">Bee Proper</h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <p className="text-neutral-400 text-sm">
              Find proper nouns using these letters
            </p>
            <HowToPlay />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <span className="text-neutral-400">Loading puzzle...</span>
            </div>
          ) : !puzzle ? (
            <div className="text-center py-20">
              <p className="text-neutral-500">No puzzle available today.</p>
            </div>
          ) : (
            <>
              <ScoreDisplay score={score} maxScore={puzzle.max_score} />
              <GameBoard
                centerLetter={puzzle.center_letter}
                outerLetters={puzzle.outer_letters}
                onSubmit={handleSubmit}
                message={message}
                isError={isError}
              />
              <FoundWords
                words={foundWords}
                puzzleLetters={[
                  puzzle.center_letter,
                  ...puzzle.outer_letters,
                ]}
              />
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
