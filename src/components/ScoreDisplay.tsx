"use client";

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
}

const RANKS = [
  { name: "Getting Started", threshold: 0 },
  { name: "Good", threshold: 0.2 },
  { name: "Great", threshold: 0.4 },
  { name: "Amazing", threshold: 0.6 },
  { name: "Genius", threshold: 0.8 },
];

function getRank(score: number, maxScore: number) {
  if (maxScore === 0) return { current: RANKS[0], next: RANKS[1] };
  const pct = score / maxScore;
  let currentIdx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (pct >= RANKS[i].threshold) currentIdx = i;
  }
  return {
    current: RANKS[currentIdx],
    next: currentIdx < RANKS.length - 1 ? RANKS[currentIdx + 1] : null,
  };
}

export default function ScoreDisplay({ score, maxScore }: ScoreDisplayProps) {
  const { current, next } = getRank(score, maxScore);
  const progress = maxScore > 0 ? (score / maxScore) * 100 : 0;

  const pointsToNext = next
    ? Math.ceil(next.threshold * maxScore) - score
    : 0;

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-lg">{current.name}</span>
        <span className="text-neutral-500 text-sm">{score} pts</span>
      </div>
      {next && pointsToNext > 0 && (
        <p className="text-xs text-neutral-400 mb-2">
          {pointsToNext} more point{pointsToNext !== 1 ? "s" : ""} to {next.name}
        </p>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2 relative">
        <div
          className="bg-amber-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {/* Threshold markers */}
        {RANKS.slice(1).map((r) => (
          <div
            key={r.name}
            className="absolute top-0 w-0.5 h-2 bg-neutral-300"
            style={{ left: `${r.threshold * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
