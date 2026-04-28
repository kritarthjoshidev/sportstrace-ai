"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PlatformChart({
  data,
}: {
  data: Array<{ platform: string; detections: number; change: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, left: -20, right: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="platform-bars" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
          <XAxis dataKey="platform" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [value, "detections"]}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(226,232,240,1)",
              borderRadius: 16,
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.1)",
            }}
          />
          <Bar dataKey="detections" fill="url(#platform-bars)" radius={[10, 10, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
