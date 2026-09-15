"use client";

import { useCallback, useEffect, useState } from "react";
import LsqUploadPanel from "@/components/LsqUploadPanel";
import RevenueBarChart from "@/components/RevenueBarChart";
import { MonthEntry } from "@/lib/types";

type OwnerAggRow = { name: string; sum: number; count: number };
type LsqResponse = {
  ownerAgg: OwnerAggRow[];
  totalRevenue: number;
  totalCount: number;
  notFoundCount: number;
  lsqUploadedCount: number;
};

function fmtINR(n: number): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 10000000) return "₹" + (n / 10000000).toFixed(2) + "Cr";
  if (abs >= 100000) return "₹" + (n / 100000).toFixed(2) + "L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function fmtNum(n: number): string {
  return n.toLocaleString("en-IN");
}

export default function SalesPersonDashboardClient() {
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [month, setMonth] = useState("");
  const [data, setData] = useState<LsqResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonths = useCallback(async () => {
    const res = await fetch("/api/months");
    const json = await res.json();
    const list: MonthEntry[] = json.months || [];
    setMonths(list);
    setMonth((m) => m || (list[0] ? list[0].month_key : ""));
  }, []);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  const loadData = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lsq/analytics?month=${encodeURIComponent(month)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load sales person data.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthLabel = months.find((m) => m.month_key === month)?.month_label || month;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1
          className="mono"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", margin: "0 0 8px" }}
        >
          Sales Person Dashboard
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>
          Online enrollments matched against LSQ Owner by Student ID — this is the real attribution, since the 634
          report&apos;s own Sales Person field is unreliable.
        </p>
      </div>

      {months.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <strong className="mono" style={{ display: "block", color: "var(--text)", fontSize: 16, marginBottom: 8, textTransform: "uppercase" }}>
            No 634 data yet
          </strong>
          Upload a 634 report on the Online or Offline dashboard first — this dashboard matches against that data.
        </div>
      ) : (
        <LsqUploadPanel months={months} selectedMonth={month} onMonthChange={setMonth} onUploaded={loadData} />
      )}

      {error && <div className="error-msg">{error}</div>}

      {data && (
        <>
          <div className="panel" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="field" style={{ minWidth: 170 }}>
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => (
                  <option key={m.month_key} value={m.month_key}>
                    {m.month_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <div className="panel" style={{ borderColor: "var(--purple)", borderWidth: 1.5 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>
                Online Revenue
              </div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 700 }}>{fmtINR(data.totalRevenue)}</div>
            </div>
            <div className="panel" style={{ borderColor: "var(--blue)", borderWidth: 1.5 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>
                Enrollments
              </div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 700 }}>{fmtNum(data.totalCount)}</div>
            </div>
            <div className="panel" style={{ borderColor: "var(--green)", borderWidth: 1.5 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>
                LSQ Records Loaded
              </div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 700 }}>{fmtNum(data.lsqUploadedCount)}</div>
            </div>
            <div className="panel" style={{ borderColor: data.notFoundCount > 0 ? "var(--coral)" : "var(--yellow)", borderWidth: 1.5 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>
                Not Found in LSQ
              </div>
              <div className="mono" style={{ fontSize: 27, fontWeight: 700 }}>{fmtNum(data.notFoundCount)}</div>
            </div>
          </div>

          {data.lsqUploadedCount === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "50px 20px", color: "var(--muted)" }}>
              <strong className="mono" style={{ display: "block", color: "var(--text)", fontSize: 15, marginBottom: 8, textTransform: "uppercase" }}>
                No LSQ data uploaded for {monthLabel}
              </strong>
              Upload the LSQ export above to see the sales-person-wise breakdown.
            </div>
          ) : (
            <RevenueBarChart title="Revenue by Sales Person (LSQ Owner)" data={data.ownerAgg} limit={15} />
          )}

          {loading && <div className="mono" style={{ fontSize: 11, color: "var(--muted-dim)" }}>refreshing…</div>}
        </>
      )}
    </div>
  );
}
