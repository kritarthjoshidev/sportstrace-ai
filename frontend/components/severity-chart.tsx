"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#ff5d73", "#ff9f5a", "#77e58b"];

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

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={72} outerRadius={104} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#101d30",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

