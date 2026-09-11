"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import Filters, { FilterState } from "@/components/Filters";
import KpiCards from "@/components/KpiCards";
import RevenueBarChart from "@/components/RevenueBarChart";
import StateHeatmap from "@/components/StateHeatmap";
import ComparisonTable from "@/components/ComparisonTable";
import { AnalyticsResponse, MonthEntry } from "@/lib/types";

export default function DashboardClient() {
  const [months, setMonths] = useState<MonthEntry[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    month: "",
    compareMonth: "",
    state: "",
    offering: "",
    course: "",
  });
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonths = useCallback(async (preferMonthKey?: string) => {
    const res = await fetch("/api/months");
    const json = await res.json();
    const list: MonthEntry[] = json.months || [];
    setMonths(list);
    if (list.length) {
      setFilters((f) => ({
        ...f,
        month: preferMonthKey || f.month || list[0].month_key,
        compareMonth: f.compareMonth || (list[1] ? list[1].month_key : ""),
      }));
    }
  }, []);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  const loadAnalytics = useCallback(async () => {
    if (!filters.month) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ month: filters.month });
      if (filters.compareMonth) params.set("compareMonth", filters.compareMonth);
      if (filters.state) params.set("state", filters.state);
      if (filters.offering) params.set("offering", filters.offering);
      if (filters.course) params.set("course", filters.course);
      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load analytics.");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const stateOptions = useMemo(
    () => (data?.current.aggregates.stateAgg || []).map((s) => s.name).sort(),
    [data]
  );
  const offeringOptions = useMemo(
    () => (data?.current.aggregates.offeringAgg || []).map((s) => s.name).sort(),
    [data]
  );
  const courseOptions = useMemo(
    () => (data?.current.aggregates.courseAgg || []).map((s) => s.name).sort(),
    [data]
  );

  function handleUploaded(monthKey: string) {
    loadMonths(monthKey);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1
          className="mono"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", margin: "0 0 8px" }}
        >
          SuperGrads Online Sales Dashboard
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>
          Online enrollments only — filtered from your uploaded 634 report.
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
          <Filters
            months={months}
            filters={filters}
            onChange={setFilters}
            stateOptions={stateOptions}
            offeringOptions={offeringOptions}
            courseOptions={courseOptions}
          />

          <KpiCards current={data.current.aggregates} previous={data.previous?.aggregates} />

          <RevenueBarChart title="Revenue by Course" data={data.current.aggregates.courseAgg} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <RevenueBarChart title="Revenue by Offering Type" data={data.current.aggregates.offeringAgg} limit={8} />
            <StateHeatmap stateAgg={data.current.aggregates.stateAgg} />
          </div>

          {data.previous && (
            <ComparisonTable
              current={data.current.aggregates}
              currentMeta={data.current.meta}
              previous={data.previous.aggregates}
              previousMeta={data.previous.meta}
            />
          )}

          {data.current.meta && (
            <div className="mono" style={{ fontSize: 11, color: "var(--muted-dim)", lineHeight: 1.7 }}>
              {`> ${data.current.meta.month_label}: ${data.current.meta.total_rows} rows → ${data.current.meta.excluded_offline} offline excluded, ${data.current.meta.excluded_zero} low-value (≤₹100) excluded → ${data.current.meta.included_count} counted`}
              {loading ? " · refreshing…" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
