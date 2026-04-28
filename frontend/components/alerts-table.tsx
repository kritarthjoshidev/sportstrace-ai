import Link from "next/link";

import { DetectionAlert } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";

export function AlertsTable({ alerts }: { alerts: DetectionAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-sm text-muted">
        No alerts yet. Once suspected uploads are analyzed, detection results will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/8">
      <table className="min-w-full divide-y divide-white/8 text-left text-sm">
        <thead className="bg-white/[0.03] text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Result</th>
            <th className="px-4 py-3 font-medium">Original</th>
            <th className="px-4 py-3 font-medium">Suspect</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Detected</th>
            <th className="px-4 py-3 font-medium">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {alerts.map((alert) => (
            <tr key={alert.id} className="bg-panelAlt/40">
              <td className="px-4 py-4">
                <StatusPill result={alert.result} />
              </td>
              <td className="px-4 py-4 text-white">{alert.original_title}</td>
              <td className="px-4 py-4 text-muted">{alert.suspect_title}</td>
              <td className="px-4 py-4 text-white">{formatPercent(alert.score)}</td>
              <td className="px-4 py-4 text-white">{formatPercent(alert.confidence)}</td>
              <td className="px-4 py-4 text-muted">{formatDate(alert.created_at)}</td>
              <td className="px-4 py-4">
                <Link
                  href={`/comparison/${alert.id}`}
                  className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-accent"
                >
                  Inspect
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

