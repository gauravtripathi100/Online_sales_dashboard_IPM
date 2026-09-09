"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { fmtINR } from "./KpiCards";

const PALETTE = ["#7C5CFC", "#54A7E5", "#6AD09D", "#F2C24B", "#EC666C", "#3E5C76", "#8FA998", "#B08968"];

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function RevenueBarChart({
  title,
  data,
  limit = 10,
}: {
  title: string;
  data: { name: string; sum: number; count: number }[];
  limit?: number;
}) {
  const top = data.slice(0, limit);
  const rest = data.slice(limit);
  const chartData = [...top.map((d) => ({ name: truncate(d.name, 28), full: d.name, value: d.sum, count: d.count }))];
  if (rest.length) {
    chartData.push({
      name: `Others (${rest.length})`,
      full: `Others (${rest.length})`,
      value: rest.reduce((s, r) => s + r.sum, 0),
      count: rest.reduce((s, r) => s + r.count, 0),
    });
  }
  const height = Math.max(220, chartData.length * 34);

  return (
    <div className="panel">
      <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 16px" }}>
        {title}
      </h2>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#25252F" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => fmtINR(v)}
            tick={{ fill: "#868A9C", fontSize: 11 }}
            axisLine={{ stroke: "#25252F" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={190}
            tick={{ fill: "#F2F3F6", fontSize: 12 }}
            axisLine={{ stroke: "#25252F" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#1B1B26" }}
            contentStyle={{ background: "#12121B", border: "1px solid #25252F", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#F2F3F6", fontWeight: 600 }}
            formatter={(value: any, _name, item: any) => [fmtINR(Number(value)) + `  (${item.payload.count} sales)`, "Revenue"]}
            labelFormatter={(label, payload) => (payload?.[0]?.payload?.full as string) || label}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
