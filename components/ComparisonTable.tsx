"use client";

import { Aggregates, UploadMeta } from "@/lib/types";
import { fmtINR, fmtNum, pct } from "./KpiCards";

export default function ComparisonTable({
  current,
  currentMeta,
  previous,
  previousMeta,
}: {
  current: Aggregates;
  currentMeta: UploadMeta | null;
  previous: Aggregates;
  previousMeta: UploadMeta | null;
}) {
  const rows: [string, string, string, number | null][] = [
    ["Online Revenue", fmtINR(previous.revenue), fmtINR(current.revenue), pct(current.revenue, previous.revenue)],
    ["Enrollments", fmtNum(previous.count), fmtNum(current.count), pct(current.count, previous.count)],
    ["Avg. Deal Size", fmtINR(previous.avg), fmtINR(current.avg), pct(current.avg, previous.avg)],
    ["Daily Pace (₹/day)", fmtINR(previous.pace), fmtINR(current.pace), pct(current.pace, previous.pace)],
  ];

  return (
    <div className="panel">
      <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 16px" }}>
        Month-on-Month Comparison
      </h2>
      <table className="data">
        <thead>
          <tr>
            <th>Metric</th>
            <th style={{ textAlign: "right" }}>{previousMeta?.month_label || "Previous"}</th>
            <th style={{ textAlign: "right" }}>{currentMeta?.month_label || "Current"}</th>
            <th style={{ textAlign: "right" }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, pv, cv, p]) => {
            const cls = p === null ? "flat" : p > 0.05 ? "up" : p < -0.05 ? "down" : "flat";
            const arrow = p === null ? "—" : p > 0.05 ? "▲" : p < -0.05 ? "▼" : "—";
            const color = cls === "up" ? "var(--green)" : cls === "down" ? "var(--coral)" : "var(--muted)";
            return (
              <tr key={label}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td className="mono" style={{ textAlign: "right" }}>{pv}</td>
                <td className="mono" style={{ textAlign: "right" }}>{cv}</td>
                <td className="mono" style={{ textAlign: "right", color, fontWeight: 700 }}>
                  {p === null ? "—" : `${arrow} ${Math.abs(p).toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
