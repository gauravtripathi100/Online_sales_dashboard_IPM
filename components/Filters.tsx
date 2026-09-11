"use client";

import { MonthEntry } from "@/lib/types";

export type FilterState = {
  month: string;
  compareMonth: string;
  state: string;
  offering: string;
  course: string;
  center: string;
};

export default function Filters({
  months,
  filters,
  onChange,
  stateOptions,
  offeringOptions,
  courseOptions,
  centerOptions,
}: {
  months: MonthEntry[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  stateOptions: string[];
  offeringOptions: string[];
  courseOptions: string[];
  centerOptions?: string[];
}) {
  function set<K extends keyof FilterState>(key: K, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const showCenter = !!centerOptions && centerOptions.length > 0;
  const hasAnyFilter = filters.state || filters.offering || filters.course || filters.center;

  return (
    <div className="panel" style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div className="field" style={{ minWidth: 170 }}>
        <label>Month</label>
        <select value={filters.month} onChange={(e) => set("month", e.target.value)}>
          {months.map((m) => (
            <option key={m.month_key} value={m.month_key}>
              {m.month_label}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ minWidth: 170 }}>
        <label>Compare To</label>
        <select value={filters.compareMonth} onChange={(e) => set("compareMonth", e.target.value)}>
          <option value="">None</option>
          {months
            .filter((m) => m.month_key !== filters.month)
            .map((m) => (
              <option key={m.month_key} value={m.month_key}>
                {m.month_label}
              </option>
            ))}
        </select>
      </div>
      <div className="field" style={{ minWidth: 160 }}>
        <label>State</label>
        <select value={filters.state} onChange={(e) => set("state", e.target.value)}>
          <option value="">All States</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ minWidth: 190 }}>
        <label>Offering Type</label>
        <select value={filters.offering} onChange={(e) => set("offering", e.target.value)}>
          <option value="">All Offerings</option>
          {offeringOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {showCenter && (
        <div className="field" style={{ minWidth: 190 }}>
          <label>Center</label>
          <select value={filters.center} onChange={(e) => set("center", e.target.value)}>
            <option value="">All Centers</option>
            {centerOptions!.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field" style={{ minWidth: 220, flex: 1 }}>
        <label>Course</label>
        <select value={filters.course} onChange={(e) => set("course", e.target.value)}>
          <option value="">All Courses</option>
          {courseOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {hasAnyFilter && (
        <button
          className="btn ghost sm"
          onClick={() => onChange({ ...filters, state: "", offering: "", course: "", center: "" })}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
