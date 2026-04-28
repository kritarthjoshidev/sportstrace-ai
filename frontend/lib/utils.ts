import { clsx } from "clsx";

import { DetectionResult } from "@/lib/types";

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function statusClasses(result: DetectionResult): string {
  return clsx(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]",
    result === "pirated" && "bg-danger/15 text-danger",
    result === "suspicious" && "bg-warning/15 text-warning",
    result === "safe" && "bg-success/15 text-success"
  );
}

export function scoreBarColor(result: DetectionResult): string {
  if (result === "pirated") {
    return "from-danger to-warning";
  }
  if (result === "suspicious") {
    return "from-warning to-accent";
  }
  return "from-success to-accent";
}

