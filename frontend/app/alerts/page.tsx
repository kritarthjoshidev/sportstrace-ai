"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { AlertsTable } from "@/components/alerts-table";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/section-card";
import { Skeleton } from "@/components/skeleton";
import { getAlerts } from "@/lib/api";
import { DetectionAlert } from "@/lib/types";
import { formatCompactNumber, getAlertPlatform } from "@/lib/utils";

const severityFilters = [
  { label: "All severities", value: "" },
  { label: "Pirated", value: "pirated" },
  { label: "Suspicious", value: "suspicious" },
  { label: "Safe", value: "safe" },
];

const dateFilters = [
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [severity, setSeverity] = useState("");
  const [platform, setPlatform] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextAlerts = await getAlerts();
        if (alive) {
          setAlerts(nextAlerts);
          setError(null);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load alerts.");
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const platforms = useMemo(() => {
    const values = new Set(alerts.map((alert) => getAlertPlatform(alert)));
    return ["all", ...Array.from(values)];
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const now = Date.now();
    const rangeLimit =
      timeRange === "24h" ? 24 * 60 * 60 * 1000 : timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSeverity = !severity || alert.result === severity;
      const matchesPlatform = platform === "all" || getAlertPlatform(alert) === platform;
      const matchesTime = now - new Date(alert.created_at).getTime() <= rangeLimit;
      const matchesQuery =
        !normalizedQuery ||
        alert.original_title.toLowerCase().includes(normalizedQuery) ||
        alert.suspect_title.toLowerCase().includes(normalizedQuery);

      return matchesSeverity && matchesPlatform && matchesTime && matchesQuery;
    });
  }, [alerts, deferredQuery, platform, severity, timeRange]);

  const piratedCount = filteredAlerts.filter((alert) => alert.result === "pirated").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident Queue"
        title="Investigate, filter, and escalate piracy alerts."
        description="Slice detections by severity, platform, and recency to move the highest-risk cases through evidence review and takedown workflows."
      />

      <SectionCard
        eyebrow="Filters"
        title="Alert control center"
        description="All filters are applied client-side so the workspace stays responsive while backend APIs are being expanded."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="field-shell flex h-12 items-center gap-3 px-4">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by original title or suspect clip"
              className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-subdued"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="field">
              {severityFilters.map((filter) => (
                <option key={filter.value} value={filter.value} className="bg-white text-slate-950">
                  {filter.label}
                </option>
              ))}
            </select>
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} className="field">
              {platforms.map((item) => (
                <option key={item} value={item} className="bg-white text-slate-950">
                  {item === "all" ? "All platforms" : item}
                </option>
              ))}
            </select>
            <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className="field">
              {dateFilters.map((filter) => (
                <option key={filter.value} value={filter.value} className="bg-white text-slate-950">
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-subdued">Filtered results</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCompactNumber(filteredAlerts.length)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-subdued">High priority</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCompactNumber(piratedCount)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.24em] text-subdued">Platforms in scope</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{platforms.length - 1}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Detection Cases" title="Alerts feed">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-[28px]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[24px] border border-danger/20 bg-danger/10 px-5 py-5 text-sm text-danger">{error}</div>
        ) : (
          <AlertsTable alerts={filteredAlerts} />
        )}
      </SectionCard>
    </div>
  );
}
