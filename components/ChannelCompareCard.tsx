"use client";

import { Aggregates } from "@/lib/types";
import { fmtINR, fmtNum } from "./KpiCards";

export default function ChannelCompareTable({
  monthLabel,
  online,
  offline,
}: {
  monthLabel: string;
  online: Aggregates;
  offline: Aggregates;
}) {
  const totalRevenue = online.revenue + offline.revenue;
  const totalCount = online.count + offline.count;
  const onlineShare = totalRevenue ? ((online.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
  const offlineShare = totalRevenue ? ((offline.revenue / totalRevenue) * 100).toFixed(1) : "0.0";
  // Combined ARPU must use Gold-only revenue/count, same as each channel's own
  // ARPU — blending with the full revenue/count here would silently reintroduce
  // the same distortion this metric was fixed to avoid.
  const totalGoldRevenue = online.goldRevenue + offline.goldRevenue;
  const totalGoldCount = online.goldCount + offline.goldCount;

  const rows: [string, string, string, string][] = [
    ["Revenue", fmtINR(online.revenue), fmtINR(offline.revenue), fmtINR(totalRevenue)],
    ["Enrollments", fmtNum(online.count), fmtNum(offline.count), fmtNum(totalCount)],
    ["ARPU (Gold)", fmtINR(online.avg), fmtINR(offline.avg), fmtINR(totalGoldCount ? totalGoldRevenue / totalGoldCount : 0)],
    ["Revenue Share", `${onlineShare}%`, `${offlineShare}%`, "100%"],
  ];

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: 0 }}>
          Online vs Offline
        </h2>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted-dim)" }}>
          {monthLabel}
        </span>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Metric</th>
            <th style={{ textAlign: "right", color: "var(--purple)" }}>Online</th>
            <th style={{ textAlign: "right", color: "var(--blue)" }}>Offline</th>
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, o, f, t]) => (
            <tr key={label}>
              <td style={{ fontWeight: 600 }}>{label}</td>
              <td className="mono" style={{ textAlign: "right" }}>{o}</td>
              <td className="mono" style={{ textAlign: "right" }}>{f}</td>
              <td className="mono" style={{ textAlign: "right", color: "var(--muted)" }}>{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
