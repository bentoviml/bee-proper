"use client";

import { toTitleCase, isPangram } from "@/lib/utils";

interface FoundWordsProps {
  words: string[];
  puzzleLetters: string[];
}

export default function FoundWords({ words, puzzleLetters }: FoundWordsProps) {
  const sorted = [...words].sort();

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-neutral-700">
          Found words ({words.length})
        </h2>
      </div>
      {sorted.length === 0 ? (
        <p className="text-neutral-400 text-sm">No words found yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map((word) => (
            <span
              key={word}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPangram(word, puzzleLetters)
                  ? "bg-amber-400 text-black"
                  : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {toTitleCase(word)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
