"use client";

import { useEffect, useState } from "react";

import { AlertsTable } from "@/components/alerts-table";
import { MetricCard } from "@/components/metric-card";
import { SectionCard } from "@/components/section-card";
import { SeverityChart } from "@/components/severity-chart";
import { TrendChart } from "@/components/trend-chart";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextStats = await getDashboardStats();
        if (alive) {
          setStats(nextStats);
          setError(null);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return <div className="rounded-[28px] border border-danger/30 bg-danger/10 px-6 py-16 text-center text-danger">{error}</div>;
  }

  if (!stats) {
    return <div className="rounded-[28px] border border-white/8 bg-panel/80 px-6 py-16 text-center text-muted">Loading dashboard telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Protected library" value={`${stats.total_originals}`} hint="Official source videos available for matching." />
        <MetricCard label="Piracy alerts" value={`${stats.piracy_alerts}`} hint="High-confidence piracy detections needing action." tone="danger" />
        <MetricCard label="Suspect uploads" value={`${stats.total_suspects}`} hint="Total uploads analyzed against the rights inventory." tone="warning" />
        <MetricCard label="Average similarity" value={formatPercent(stats.average_score)} hint="Mean risk score across all completed comparisons." tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard eyebrow="Detection trend" title="Piracy activity over time">
          <TrendChart data={stats.trend} />
        </SectionCard>
        <SectionCard eyebrow="Case mix" title="Severity distribution">
          <SeverityChart piracy={stats.piracy_alerts} suspicious={stats.suspicious_cases} safe={stats.safe_cases} />
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <div className="flex items-center justify-between rounded-2xl bg-panelAlt/60 px-4 py-3">
              <span>Pirated</span>
              <span className="text-white">{stats.piracy_alerts}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-panelAlt/60 px-4 py-3">
              <span>Suspicious</span>
              <span className="text-white">{stats.suspicious_cases}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-panelAlt/60 px-4 py-3">
              <span>Safe</span>
              <span className="text-white">{stats.safe_cases}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Live queue" title="Recent piracy alerts">
        <AlertsTable alerts={stats.recent_alerts} />
      </SectionCard>
    </div>
  );
}
