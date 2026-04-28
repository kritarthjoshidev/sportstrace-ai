import { DetectionResult } from "@/lib/types";
import { formatPercent, scoreBarColor } from "@/lib/utils";

export function ScoreGauge({
  score,
  confidence,
  result,
  title = "Match score",
}: {
  score: number;
  confidence: number;
  result: DetectionResult;
  title?: string;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - score * circumference;
  const gradientId = `${result}-score-ring`;

  return (
    <div className="surface-muted p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{formatPercent(score)}</p>
          <p className="mt-1 text-sm text-muted">Confidence {formatPercent(confidence)}</p>
        </div>
        <div className="relative flex h-[138px] w-[138px] items-center justify-center">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor={result === "pirated" ? "#fb7185" : result === "suspicious" ? "#f59e0b" : "#34d399"} />
                <stop offset="100%" stopColor={result === "pirated" ? "#8b5cf6" : "#35d5ff"} />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="14" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="14"
            />
          </svg>
          <div className="absolute text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Risk</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{formatPercent(score)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(result)}`}
          style={{ width: `${Math.max(12, score * 100)}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-subdued">Similarity</p>
          <p className="mt-1 font-semibold text-slate-950">{formatPercent(score)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-subdued">Model confidence</p>
          <p className="mt-1 font-semibold text-slate-950">{formatPercent(confidence)}</p>
        </div>
      </div>
    </div>
  );
}
