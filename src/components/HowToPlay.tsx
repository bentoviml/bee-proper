"use client";

import { useState, useEffect } from "react";

export default function HowToPlay() {
  const [open, setOpen] = useState(false);

  // Show on first visit
  useEffect(() => {
    const seen = localStorage.getItem("bee-proper-instructions-seen");
    if (!seen) {
      setOpen(true);
      localStorage.setItem("bee-proper-instructions-seen", "true");
    }
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors"
      >
        How to Play
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">How to Play</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm text-neutral-700">
          <p>
            Create words using the letters provided. Every word must be a{" "}
            <strong>proper noun</strong> — a city name, surname, or first name.
          </p>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Rules</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Words must include the <strong className="text-amber-500">center letter</strong></li>
              <li>Words must be at least <strong>4 letters</strong> long</li>
              <li>Letters can be <strong>reused</strong></li>
              <li>Only the 7 given letters can be used</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Scoring</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>4-letter words: <strong>1 point</strong></li>
              <li>5+ letter words: <strong>1 point per letter</strong></li>
              <li>
                <strong>Pangram</strong> (uses all 7 letters): word points{" "}
                <strong>+ 7 bonus</strong>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-neutral-900 mb-1">Controls</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Click letters or type on your keyboard</li>
              <li><strong>Enter</strong> to submit</li>
              <li><strong>Backspace</strong> to delete</li>
              <li><strong>Shuffle</strong> to rearrange outer letters</li>
            </ul>
          </div>

          <p className="text-neutral-500 text-xs">
            A new puzzle appears every day at midnight Eastern Time.
          </p>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full mt-5 py-2 bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-lg transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
