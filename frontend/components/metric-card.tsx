"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "brand" | "danger" | "warning" | "success" | "cyan";
  delta?: string;
}

const toneMap = {
  brand: {
    gradient: "from-brand/12 via-cyan/5 to-transparent",
    icon: "bg-brand/10 text-brand",
    border: "border-slate-200",
  },
  cyan: {
    gradient: "from-cyan/12 via-brand/6 to-transparent",
    icon: "bg-cyan/10 text-cyan",
    border: "border-slate-200",
  },
  danger: {
    gradient: "from-danger/12 via-danger/5 to-transparent",
    icon: "bg-danger/10 text-danger",
    border: "border-slate-200",
  },
  warning: {
    gradient: "from-warning/12 via-warning/5 to-transparent",
    icon: "bg-warning/10 text-warning",
    border: "border-slate-200",
  },
  success: {
    gradient: "from-success/12 via-success/5 to-transparent",
    icon: "bg-success/10 text-success",
    border: "border-slate-200",
  },
};

export function MetricCard({ label, value, hint, icon: Icon, tone = "brand", delta }: MetricCardProps) {
  const palette = toneMap[tone];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-md",
        palette.border
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", palette.gradient)} />
      <div className={cn("absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r", palette.gradient)} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-muted">{label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{value}</p>
          </div>
          <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200", palette.icon)}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="max-w-[16rem] text-sm leading-6 text-muted">{hint}</p>
          {delta ? (
            <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
              {delta}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
