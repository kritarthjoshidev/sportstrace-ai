import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { DetectionAlert } from "@/lib/types";
import { formatDate, formatPercent, getAlertPlatform } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";

export function AlertsTable({ alerts }: { alerts: DetectionAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-muted">
        No alerts yet. Once suspected uploads are analyzed, detection results will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-md transition hover:bg-slate-50 lg:grid-cols-[1.8fr_1fr_0.7fr_0.75fr_0.7fr]"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">{getAlertPlatform(alert)}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-[112px_1fr]">
              <div className="flex aspect-video items-end overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/10 via-brand2/6 to-cyan/8 p-3">
                <span className="rounded-full border border-white/80 bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-700">
                  Live capture
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">{alert.suspect_title}</p>
                <p className="mt-1 truncate text-sm text-muted">Matched with {alert.original_title}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill result={alert.result} />
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-muted">
                    {formatDate(alert.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-subdued">Match score</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatPercent(alert.score)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-subdued">Confidence</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatPercent(alert.confidence)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-subdued">Severity</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">P{alert.severity_rank}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-subdued">Detected</p>
            <p className="mt-2 text-sm text-slate-950">{formatDate(alert.created_at)}</p>
          </div>

          <div className="flex items-center justify-start lg:justify-end">
            <Link
              href={`/comparison/${alert.id}`}
              className="secondary-button gap-2"
            >
              Inspect
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
