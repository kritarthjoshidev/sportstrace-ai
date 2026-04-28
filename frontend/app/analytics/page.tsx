"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Layers3, ShieldAlert, Workflow } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PlatformChart } from "@/components/platform-chart";
import { SectionCard } from "@/components/section-card";
import { SeverityChart } from "@/components/severity-chart";
import { Skeleton } from "@/components/skeleton";
import { TrendChart } from "@/components/trend-chart";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import {
  buildPlatformBreakdown,
  deriveDetectionAccuracy,
  formatCompactNumber,
  formatPercent,
} from "@/lib/utils";

export default function AnalyticsPage() {
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
          setError(loadError instanceof Error ? loadError.message : "Unable to load analytics.");
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const platformData = useMemo(() => buildPlatformBreakdown(stats?.recent_alerts ?? []), [stats]);
  const accuracy = stats ? deriveDetectionAccuracy(stats) : 0;

  if (!stats && !error) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 rounded-[32px]" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[420px] rounded-[28px]" />
          <Skeleton className="h-[420px] rounded-[28px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Measure signal quality, platform exposure, and enforcement throughput."
        description="This workspace is designed for content protection teams that need sharp visibility into how piracy is spreading and how well their response system is performing."
      />

      {error ? (
        <SectionCard eyebrow="Analytics" title="Unavailable">
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-5 py-5 text-sm text-danger">{error}</div>
        </SectionCard>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Detection accuracy</p>
                  <p className="text-sm text-muted">Weighted confidence model</p>
                </div>
              </div>
              <p className="mt-5 text-4xl font-semibold text-slate-950">{formatPercent(accuracy)}</p>
            </div>
            <div className="surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Average similarity</p>
                  <p className="text-sm text-muted">Across all completed checks</p>
                </div>
              </div>
              <p className="mt-5 text-4xl font-semibold text-slate-950">{formatPercent(stats.average_score)}</p>
            </div>
            <div className="surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/15 text-success">
                  <Layers3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Catalog footprint</p>
                  <p className="text-sm text-muted">Protected items in active scope</p>
                </div>
              </div>
              <p className="mt-5 text-4xl font-semibold text-slate-950">{formatCompactNumber(stats.total_videos)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <SectionCard eyebrow="Trend Analysis" title="Detection trend by outcome">
              <TrendChart data={stats.trend} />
            </SectionCard>
            <SectionCard eyebrow="Threat Mix" title="Current case distribution">
              <SeverityChart piracy={stats.piracy_alerts} suspicious={stats.suspicious_cases} safe={stats.safe_cases} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard eyebrow="Platform Breakdown" title="Likely distribution by channel">
              <PlatformChart data={platformData} />
            </SectionCard>
            <SectionCard eyebrow="Performance Notes" title="Operational observations">
              <div className="space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Mirror channels are clustering faster</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Recent suspect clips indicate synchronized repost behavior, especially on the top two detected platforms.
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-4 w-4 text-brand" />
                  </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Queue efficiency is strong</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Current volume suggests the system can absorb another live event spike without increasing manual review latency.
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-950">Recommended next API expansion</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Add real platform attribution and notice-delivery analytics so this view can replace the last manual spreadsheet.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
