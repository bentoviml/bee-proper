"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GameBoardProps {
  centerLetter: string;
  outerLetters: string[];
  onSubmit: (word: string) => void;
  message: string;
  isError: boolean;
}

function HexButton({
  letter,
  isCenter,
  onClick,
}: {
  letter: string;
  isCenter: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 sm:w-20 sm:h-20 font-bold text-xl sm:text-2xl transition-colors
        ${
          isCenter
            ? "bg-amber-400 hover:bg-amber-500 text-black"
            : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800"
        }`}
      style={{
        clipPath:
          "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
      }}
    >
      {letter}
    </button>
  );
}

export default function GameBoard({
  centerLetter,
  outerLetters,
  onSubmit,
  message,
  isError,
}: GameBoardProps) {
  const [input, setInput] = useState("");
  const [shuffled, setShuffled] = useState(outerLetters);
  const inputRef = useRef("");

  // Keep ref in sync with state
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const addLetter = useCallback((letter: string) => {
    setInput((prev) => prev + letter);
  }, []);

  const handleSubmit = useCallback(() => {
    const current = inputRef.current;
    if (current.length > 0) {
      setInput("");
      onSubmit(current);
    }
  }, [onSubmit]);

  const shuffle = () => {
    setShuffled((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  // Global keyboard listener
  useEffect(() => {
    const allLetters = new Set([centerLetter, ...outerLetters].map((l) => l.toUpperCase()));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Backspace") {
        setInput((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        const letter = e.key.toUpperCase();
        if (allLetters.has(letter)) {
          setInput((prev) => prev + letter);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [centerLetter, outerLetters, handleSubmit]);

  const displayInput = input
    .split("")
    .map((l, i) => {
      const isCenter = l === centerLetter;
      return (
        <span key={i} className={isCenter ? "text-amber-500 font-bold" : ""}>
          {l}
        </span>
      );
    });

  // Hexagonal layout positions
  // Top row: letters[0], letters[1]
  // Middle row: letters[2], CENTER, letters[3]
  // Bottom row: letters[4], letters[5]
  const s = shuffled;

  return (
    <div className="flex flex-col items-center">
      {/* Input display */}
      <div className={`h-12 flex items-center justify-center mb-4 min-w-[200px] ${isError ? "animate-shake" : ""}`}>
        <span className="text-2xl font-semibold tracking-widest uppercase">
          {displayInput.length > 0 ? displayInput : (
            <span className="text-neutral-300">Type or click</span>
          )}
        </span>
        <span className="animate-pulse ml-0.5 text-2xl text-amber-400">|</span>
      </div>

      {/* Message */}
      <div className="h-8 mb-3 flex items-center justify-center">
        {message && (
          <p className={`text-sm font-medium px-4 py-1 rounded-full ${
            isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}>
            {message}
          </p>
        )}
      </div>

      {/* Hex grid */}
      <div className="flex flex-col items-center gap-1">
        {/* Row 1 */}
        <div className="flex gap-1">
          <HexButton letter={s[0]} isCenter={false} onClick={() => addLetter(s[0])} />
          <HexButton letter={s[1]} isCenter={false} onClick={() => addLetter(s[1])} />
        </div>
        {/* Row 2 */}
        <div className="flex gap-1 -mt-3">
          <HexButton letter={s[2]} isCenter={false} onClick={() => addLetter(s[2])} />
          <HexButton letter={centerLetter} isCenter={true} onClick={() => addLetter(centerLetter)} />
          <HexButton letter={s[3]} isCenter={false} onClick={() => addLetter(s[3])} />
        </div>
        {/* Row 3 */}
        <div className="flex gap-1 -mt-3">
          <HexButton letter={s[4]} isCenter={false} onClick={() => addLetter(s[4])} />
          <HexButton letter={s[5]} isCenter={false} onClick={() => addLetter(s[5])} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setInput((prev) => prev.slice(0, -1))}
          className="px-4 py-2 border border-neutral-300 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={shuffle}
          className="px-4 py-2 border border-neutral-300 rounded-full text-sm font-medium hover:bg-neutral-100 transition-colors"
        >
          Shuffle
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-500 rounded-full text-sm font-bold transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
