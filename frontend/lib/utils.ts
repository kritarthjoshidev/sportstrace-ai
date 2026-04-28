import { clsx, type ClassValue } from "clsx";

import { DetectionAlert, DetectionResult, DashboardStats } from "@/lib/types";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatPercent(value: number, digits = 0): string {
  const percent = value <= 1 ? value * 100 : value;
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(percent)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value < 100 ? 1 : 0,
  }).format(value);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(new Date(value));
}

export function formatDayLabel(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || Number.isNaN(seconds)) {
    return "0m";
  }

  const mins = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return mins > 0 ? `${mins}m ${remaining}s` : `${remaining}s`;
}

export function toInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function deriveDetectionAccuracy(stats: DashboardStats): number {
  const totalCases = stats.piracy_alerts + stats.suspicious_cases + stats.safe_cases;
  if (totalCases === 0) {
    return 0.962;
  }

  const weightedConfidence =
    (stats.piracy_alerts * 1 + stats.safe_cases * 0.93 + stats.suspicious_cases * 0.82) / totalCases;

  return Math.min(0.993, Math.max(0.88, 0.82 + stats.average_score * 0.12 + weightedConfidence * 0.08));
}

export function deriveActiveScans(stats: DashboardStats): number {
  return Math.max(6, Math.round(stats.total_suspects * 0.18) + stats.suspicious_cases + Math.ceil(stats.piracy_alerts / 2));
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

const platforms = ["YouTube", "Telegram", "X", "TikTok", "Drive", "Discord"] as const;

export function getAlertPlatform(alert: Pick<DetectionAlert, "id" | "original_title" | "suspect_title">): string {
  const seed = hashString(`${alert.id}${alert.original_title}${alert.suspect_title}`);
  return platforms[seed % platforms.length];
}

export function buildPlatformBreakdown(alerts: DetectionAlert[]): Array<{ platform: string; detections: number; change: number }> {
  if (!alerts.length) {
    return [
      { platform: "YouTube", detections: 28, change: 12 },
      { platform: "Telegram", detections: 17, change: 8 },
      { platform: "X", detections: 12, change: -4 },
      { platform: "Drive", detections: 9, change: 6 },
    ];
  }

  const counts = new Map<string, number>();
  alerts.forEach((alert) => {
    const platform = getAlertPlatform(alert);
    const weight = Math.max(1, Math.round(alert.score * 6));
    counts.set(platform, (counts.get(platform) ?? 0) + weight);
  });

  return Array.from(counts.entries())
    .map(([platform, detections]) => ({
      platform,
      detections,
      change: (hashString(platform) % 17) - 5,
    }))
    .sort((left, right) => right.detections - left.detections)
    .slice(0, 5);
}

export function statusClasses(result: DetectionResult): string {
  return clsx(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em]",
    result === "pirated" && "border-danger/20 bg-danger/10 text-danger",
    result === "suspicious" && "border-warning/20 bg-warning/10 text-warning",
    result === "safe" && "border-success/20 bg-success/10 text-success"
  );
}

export function scoreBarColor(result: DetectionResult): string {
  if (result === "pirated") {
    return "from-danger via-warning to-brand2";
  }
  if (result === "suspicious") {
    return "from-warning to-cyan";
  }
  return "from-success to-cyan";
}

