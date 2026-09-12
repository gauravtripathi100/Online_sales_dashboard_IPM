"use client";

import { useCallback, useEffect, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import { MonthEntry } from "@/lib/types";
import { productLabel } from "@/lib/productLogic";

type ProductAggRow = {
  product: string;
  channel: "online" | "offline" | null;
  count: number;
  sum: number;
  arpu: number;
};
type ProductsResponse = {
  current: { products: ProductAggRow[]; monthLabel: string };
  previous: { products: ProductAggRow[]; monthLabel: string } | null;
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

export default function ProductDashboardClient() {
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [month, setMonth] = useState("");
  const [compareMonth, setCompareMonth] = useState("");
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonths = useCallback(async (preferMonthKey?: string) => {
    const res = await fetch("/api/months");
    const json = await res.json();
    const list: MonthEntry[] = json.months || [];
    setMonths(list);
    if (list.length) {
      setMonth((m) => preferMonthKey || m || list[0].month_key);
    }
  }, []);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  const loadProducts = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month });
      if (compareMonth) params.set("compareMonth", compareMonth);
      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load product data.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [month, compareMonth]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function handleUploaded(monthKey: string) {
    loadMonths(monthKey);
  }

  const totalCurrentRevenue = data?.current.products.reduce((s, p) => s + p.sum, 0) || 0;
  const totalCurrentCount = data?.current.products.reduce((s, p) => s + p.count, 0) || 0;
  const totalPreviousRevenue = data?.previous?.products.reduce((s, p) => s + p.sum, 0) || 0;
  const totalPreviousCount = data?.previous?.products.reduce((s, p) => s + p.count, 0) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1
          className="mono"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", margin: "0 0 8px" }}
        >
          Product Dashboard
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>
          Unit sold, revenue, and ARPU by product — classified from Course Name text, independent of sales channel.
        </p>
      </div>

      <UploadPanel onUploaded={handleUploaded} />

      {error && <div className="error-msg">{error}</div>}

      {!data && !error && (
        <div className="panel" style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <strong className="mono" style={{ display: "block", color: "var(--text)", fontSize: 16, marginBottom: 8, textTransform: "uppercase" }}>
            No data yet
          </strong>
          Upload a 634 report above to see the dashboard.
        </div>
      )}

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
            <div className="field" style={{ minWidth: 170 }}>
              <label>Compare To</label>
              <select value={compareMonth} onChange={(e) => setCompareMonth(e.target.value)}>
                <option value="">None</option>
                {months
                  .filter((m) => m.month_key !== month)
                  .map((m) => (
                    <option key={m.month_key} value={m.month_key}>
                      {m.month_label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: 0 }}>
                Product Breakdown
              </h2>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted-dim)" }}>
                {data.current.monthLabel}
                {data.previous ? ` vs ${data.previous.monthLabel}` : ""}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Unit Sold</th>
                    <th style={{ textAlign: "right" }}>Revenue</th>
                    <th style={{ textAlign: "right" }}>ARPU</th>
                    {data.previous && (
                      <>
                        <th style={{ textAlign: "right", color: "var(--muted-dim)" }}>Prev. Units</th>
                        <th style={{ textAlign: "right", color: "var(--muted-dim)" }}>Prev. Revenue</th>
                        <th style={{ textAlign: "right" }}>Revenue Δ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.current.products.map((row) => {
                    const label = productLabel(row.product, row.channel);
                    const prevRow = data.previous?.products.find(
                      (p) => p.product === row.product && p.channel === row.channel
                    );
                    const delta =
                      prevRow && prevRow.sum
                        ? (((row.sum - prevRow.sum) / prevRow.sum) * 100).toFixed(1)
                        : null;
                    const deltaColor =
                      delta === null ? "var(--muted)" : Number(delta) > 0 ? "var(--green)" : Number(delta) < 0 ? "var(--coral)" : "var(--muted)";
                    return (
                      <tr key={label}>
                        <td style={{ fontWeight: 600 }}>{label}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmtNum(row.count)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{fmtINR(row.sum)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--muted)" }}>{fmtINR(row.arpu)}</td>
                        {data.previous && (
                          <>
                            <td className="mono" style={{ textAlign: "right", color: "var(--muted-dim)" }}>{fmtNum(prevRow?.count || 0)}</td>
                            <td className="mono" style={{ textAlign: "right", color: "var(--muted-dim)" }}>{fmtINR(prevRow?.sum || 0)}</td>
                            <td className="mono" style={{ textAlign: "right", color: deltaColor, fontWeight: 700 }}>
                              {delta === null ? "—" : `${Number(delta) > 0 ? "▲" : Number(delta) < 0 ? "▼" : "—"} ${Math.abs(Number(delta))}%`}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "2px solid var(--line)" }}>
                    <td style={{ fontWeight: 700 }}>Total</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmtNum(totalCurrentCount)}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{fmtINR(totalCurrentRevenue)}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--muted)" }}>
                      {fmtINR(totalCurrentCount ? totalCurrentRevenue / totalCurrentCount : 0)}
                    </td>
                    {data.previous && (
                      <>
                        <td className="mono" style={{ textAlign: "right", color: "var(--muted-dim)", fontWeight: 700 }}>{fmtNum(totalPreviousCount)}</td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--muted-dim)", fontWeight: 700 }}>{fmtINR(totalPreviousRevenue)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                          {totalPreviousRevenue
                            ? `${(((totalCurrentRevenue - totalPreviousRevenue) / totalPreviousRevenue) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            {loading && (
              <div className="mono" style={{ fontSize: 11, color: "var(--muted-dim)", marginTop: 10 }}>
                refreshing…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
