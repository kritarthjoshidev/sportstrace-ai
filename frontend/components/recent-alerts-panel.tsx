import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { DetectionAlert } from "@/lib/types";
import { formatDate, formatPercent, getAlertPlatform } from "@/lib/utils";

export function RecentAlertsPanel({ alerts }: { alerts: DetectionAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-[26px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-muted">
        Recent detections will appear here once the first suspect scans complete.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="group flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-md transition hover:bg-slate-50 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-32 shrink-0 items-end overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand/10 via-brand2/6 to-cyan/8 p-3">
              <span className="rounded-full border border-white/80 bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.26em] text-slate-700">
                {getAlertPlatform(alert)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-950">{alert.suspect_title}</p>
              <p className="mt-1 truncate text-sm text-muted">Matched against {alert.original_title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill result={alert.result} />
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-muted">
                  {formatDate(alert.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3 sm:pl-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-subdued">Match score</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{formatPercent(alert.score)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-subdued">Status</p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-950">{alert.result}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.24em] text-subdued">Confidence</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{formatPercent(alert.confidence)}</p>
            </div>
          </div>

          <Link
            href={`/comparison/${alert.id}`}
            className="secondary-button gap-2"
          >
            View case
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
