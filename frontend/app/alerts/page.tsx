"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { AlertsTable } from "@/components/alerts-table";
import { SectionCard } from "@/components/section-card";
import { getAlerts } from "@/lib/api";
import { DetectionAlert } from "@/lib/types";

const filters = [
  { label: "All", value: "" },
  { label: "Pirated", value: "pirated" },
  { label: "Suspicious", value: "suspicious" },
  { label: "Safe", value: "safe" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deferredFilter = useDeferredValue(filter);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextAlerts = await getAlerts(deferredFilter || undefined);
        if (alive) {
          setAlerts(nextAlerts);
          setError(null);
        }
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load alerts.");
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [deferredFilter]);

  const heading = useMemo(() => {
    if (!filter) {
      return "All detection alerts";
    }
    return `${filter[0]?.toUpperCase() ?? ""}${filter.slice(1)} cases`;
  }, [filter]);

  return (
    <SectionCard eyebrow="Response queue" title={heading}>
      <div className="mb-5 flex flex-wrap gap-3">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
              filter === item.value
                ? "bg-accent text-slate-950"
                : "border border-white/8 bg-panelAlt/60 text-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? (
        <div className="mb-5 rounded-3xl border border-danger/30 bg-danger/10 px-4 py-4 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <AlertsTable alerts={alerts} />
    </SectionCard>
  );
}
