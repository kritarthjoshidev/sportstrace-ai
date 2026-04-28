"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendChart({
  data,
}: {
  data: Array<{ day: string; pirated: number; suspicious: number; safe: number }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pirated" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ff5d73" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff5d73" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="suspicious" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ff9f5a" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff9f5a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="safe" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#39d0c8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#39d0c8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="day" stroke="#90a3c0" />
          <YAxis stroke="#90a3c0" />
          <Tooltip
            contentStyle={{
              background: "#101d30",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: "#eef3fb"
            }}
          />
          <Area type="monotone" dataKey="pirated" stroke="#ff5d73" fill="url(#pirated)" strokeWidth={2} />
          <Area type="monotone" dataKey="suspicious" stroke="#ff9f5a" fill="url(#suspicious)" strokeWidth={2} />
          <Area type="monotone" dataKey="safe" stroke="#39d0c8" fill="url(#safe)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

