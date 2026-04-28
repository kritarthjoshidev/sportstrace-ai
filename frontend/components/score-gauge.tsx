import { DetectionResult } from "@/lib/types";
import { formatPercent, scoreBarColor } from "@/lib/utils";

export function ScoreGauge({
  score,
  confidence,
  result,
}: {
  score: number;
  confidence: number;
  result: DetectionResult;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-panelAlt/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Similarity score</p>
          <p className="mt-3 font-[Bahnschrift,Segoe_UI_Variable,sans-serif] text-4xl font-semibold text-white">
            {formatPercent(score)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Confidence</p>
          <p className="mt-3 text-lg font-semibold text-white">{formatPercent(confidence)}</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(result)}`}
          style={{ width: `${Math.max(8, score * 100)}%` }}
        />
      </div>
    </div>
  );
}

