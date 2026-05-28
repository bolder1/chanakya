"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from "recharts";

interface Point {
  label: string;
  value: number; // in paise — we convert to lakhs/rupees for the axis
  highlight?: boolean;
}

interface MoneyChartProps {
  points: Point[];
  height?: number;
  unit?: "PAISE" | "RUPEES";
}

const tooltipFormat = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

export function MoneyChart({ points, height = 220, unit = "PAISE" }: MoneyChartProps) {
  const data = points.map((p) => ({
    label: p.label,
    rupees: unit === "PAISE" ? p.value / 100 : p.value,
    highlight: p.highlight,
  }));

  const highlighted = data.find((d) => d.highlight);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#E4E7EC" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E4E7EC" }}
          />
          <YAxis
            tickFormatter={tooltipFormat}
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickLine={false}
            axisLine={{ stroke: "#E4E7EC" }}
            width={68}
          />
          <Tooltip
            cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }}
            contentStyle={{
              background: "white",
              border: "1px solid #E4E7EC",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
            formatter={(v: number) => [tooltipFormat(v), "Amount"]}
            labelStyle={{ color: "#0F172A", fontWeight: 600, marginBottom: 4 }}
          />
          <Line
            type="monotone"
            dataKey="rupees"
            stroke="#1A3D6C"
            strokeWidth={2}
            dot={{ r: 3, fill: "#1A3D6C", stroke: "white", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#0D2A4D", stroke: "white", strokeWidth: 2 }}
          />
          {highlighted && (
            <ReferenceDot
              x={highlighted.label}
              y={highlighted.rupees}
              r={6}
              fill="#F59E0B"
              stroke="white"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
