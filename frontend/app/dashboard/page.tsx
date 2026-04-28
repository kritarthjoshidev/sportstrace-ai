"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Crosshair, ShieldCheck, Siren, Sparkles } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PlatformChart } from "@/components/platform-chart";
import { RecentAlertsPanel } from "@/components/recent-alerts-panel";
import { SectionCard } from "@/components/section-card";
import { SeverityChart } from "@/components/severity-chart";
import { Skeleton } from "@/components/skeleton";
import { TrendChart } from "@/components/trend-chart";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/lib/types";
import {
  buildPlatformBreakdown,
  deriveActiveScans,
  deriveDetectionAccuracy,
  formatCompactNumber,
  formatPercent,
} from "@/lib/utils";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-52 rounded-[32px]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-[28px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Skeleton className="h-[420px] rounded-[28px]" />
        <Skeleton className="h-[420px] rounded-[28px]" />
      </div>
      <Skeleton className="h-[360px] rounded-[28px]" />
    </div>
  );
}

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

  const platformData = useMemo(() => buildPlatformBreakdown(stats?.recent_alerts ?? []), [stats]);
  const accuracy = stats ? deriveDetectionAccuracy(stats) : 0;
  const activeScans = stats ? deriveActiveScans(stats) : 0;

  if (!stats && !error) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broadcast Protection"
        title="Premium signal monitoring for sports media rights teams."
        description="Track active scans, spot rebroadcast clusters early, and move from automated evidence capture to enforcement without leaving the workspace."
        actions={
          <div className="flex flex-wrap gap-3">
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
              12 platforms monitored
            </span>
            <span className="rounded-2xl border border-cyan/20 bg-cyan/10 px-4 py-2.5 text-sm font-medium text-cyan shadow-sm">
              Threat watch active
            </span>
          </div>
        }
      />

      {error ? (
        <SectionCard eyebrow="System status" title="Dashboard unavailable">
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-5 py-5 text-sm text-danger">{error}</div>
        </SectionCard>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Videos Protected"
              value={formatCompactNumber(stats.total_originals)}
              hint="Source masters and official feeds fingerprinted for rights enforcement."
              icon={ShieldCheck}
              tone="brand"
              delta="+12% this month"
            />
            <MetricCard
              label="Piracy Alerts Detected"
              value={formatCompactNumber(stats.piracy_alerts)}
              hint="High-confidence matches flagged for review and takedown workflows."
              icon={Siren}
              tone="danger"
              delta="6 need action"
            />
            <MetricCard
              label="Detection Accuracy"
              value={formatPercent(accuracy)}
              hint="Model confidence across current similarity, sequence, and frame evidence."
              icon={Crosshair}
              tone="cyan"
              delta="Validated"
            />
            <MetricCard
              label="Active Scans"
              value={formatCompactNumber(activeScans)}
              hint="Parallel ingestion and live comparison jobs currently moving through the queue."
              icon={Activity}
              tone="warning"
              delta="Burst mode"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <SectionCard
              eyebrow="Detection Timeline"
              title="Detections over time"
              description="Compare pirated, suspicious, and safe outcomes across recent scan windows."
            >
              <TrendChart data={stats.trend} />
            </SectionCard>

            <SectionCard
              eyebrow="Platform Exposure"
              title="Platform-wise piracy"
              description="Distribution of likely detections across syndication and social channels."
            >
              <PlatformChart data={platformData} />
              <div className="mt-4 grid gap-3">
                {platformData.slice(0, 3).map((item) => (
                  <div key={item.platform} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-950">{item.platform}</p>
                      <p className="text-muted">{item.detections} detections</p>
                    </div>
                    <span className={item.change >= 0 ? "text-cyan" : "text-danger"}>
                      {item.change >= 0 ? "+" : ""}
                      {item.change}%
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              eyebrow="Live Alerts"
              title="Recent piracy alerts"
              description="High-priority matches are surfaced here with case-ready metadata and quick drill-down links."
            >
              <RecentAlertsPanel alerts={stats.recent_alerts} />
            </SectionCard>

            <SectionCard
              eyebrow="Threat Posture"
              title="Current detection mix"
              description="A fast read on how the engine is classifying the latest suspect traffic."
              actions={
                <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                  Avg similarity {formatPercent(stats.average_score)}
                </span>
              }
            >
              <SeverityChart piracy={stats.piracy_alerts} suspicious={stats.suspicious_cases} safe={stats.safe_cases} />
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-muted">Escalated takedowns</span>
                  <span className="font-semibold text-slate-950">{Math.max(4, Math.round(stats.piracy_alerts * 0.4))}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-muted">Rights proof issued</span>
                  <span className="font-semibold text-slate-950">{formatCompactNumber(stats.total_originals)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <span className="text-muted">Smart automation score</span>
                  <span className="font-semibold text-brand">{formatPercent(0.89)}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            eyebrow="Ops Summary"
            title="What changed today"
            description="A quick operational readout for legal, content protection, and broadcast operations leads."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Automated clustering</p>
                    <p className="text-sm text-muted">Mirror uploads grouped into 3 active campaigns.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">Fastest time to evidence package</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">74s</p>
                <p className="mt-2 text-sm text-muted">From ingest to case-ready match summary.</p>
              </div>
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">Protected catalog growth</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">+8 feeds</p>
                <p className="mt-2 text-sm text-muted">New rights holders onboarded this week.</p>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
