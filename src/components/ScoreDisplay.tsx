"use client";

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
}

const RANKS = [
  { name: "Beginner", threshold: 0 },
  { name: "Good Start", threshold: 0.02 },
  { name: "Moving Up", threshold: 0.05 },
  { name: "Good", threshold: 0.08 },
  { name: "Solid", threshold: 0.15 },
  { name: "Nice", threshold: 0.25 },
  { name: "Great", threshold: 0.4 },
  { name: "Amazing", threshold: 0.5 },
  { name: "Genius", threshold: 0.7 },
  { name: "Queen Bee", threshold: 1.0 },
];

function getRank(score: number, maxScore: number) {
  if (maxScore === 0) return RANKS[0];
  const pct = score / maxScore;
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (pct >= r.threshold) rank = r;
  }
  return rank;
}

export default function ScoreDisplay({ score, maxScore }: ScoreDisplayProps) {
  const rank = getRank(score, maxScore);
  const progress = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-lg">{rank.name}</span>
        <span className="text-neutral-500 text-sm">{score} pts</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className="bg-amber-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
