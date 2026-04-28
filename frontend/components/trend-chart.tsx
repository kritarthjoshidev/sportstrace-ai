"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDayLabel } from "@/lib/utils";

export function TrendChart({
  data,
}: {
  data: Array<{ day: string; pirated: number; suspicious: number; safe: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, left: -16, right: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
          <XAxis dataKey="day" stroke="#64748b" tickFormatter={formatDayLabel} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(value) => formatDayLabel(String(value))}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(226,232,240,1)",
              borderRadius: 16,
              color: "#0f172a",
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.1)",
            }}
          />
          <Line type="monotone" dataKey="pirated" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="suspicious" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="safe" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
