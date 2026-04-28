"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#ef4444", "#6366f1", "#22c55e"];

export function SeverityChart({
  piracy,
  suspicious,
  safe,
}: {
  piracy: number;
  suspicious: number;
  safe: number;
}) {
  const data = [
    { name: "Pirated", value: piracy },
    { name: "Suspicious", value: suspicious },
    { name: "Safe", value: safe },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={72} outerRadius={104} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
          <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="14">
            Threat mix
          </text>
          <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="26" fontWeight="600">
            {total}
          </text>
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(226,232,240,1)",
              borderRadius: 16,
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.1)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
