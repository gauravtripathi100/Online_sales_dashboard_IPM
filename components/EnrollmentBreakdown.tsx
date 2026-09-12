"use client";

import { useState } from "react";
import StateHeatmap from "./StateHeatmap";
import CenterEnrollmentList from "./CenterEnrollmentList";

export default function EnrollmentBreakdown({
  stateAgg,
  centerAgg,
}: {
  stateAgg: { name: string; count: number }[];
  centerAgg?: { name: string; sum: number; count: number }[];
}) {
  const hasCenter = !!centerAgg && centerAgg.length > 0;
  const [view, setView] = useState<"state" | "center">("state");

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: 0 }}>
          Enrollments by {view === "state" ? "State" : "Center"}
        </h2>
        {hasCenter && (
          <div style={{ display: "flex", gap: 2, background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 8, padding: 3 }}>
            {(["state", "center"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="mono"
                style={{
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  cursor: "pointer",
                  background: view === v ? "var(--purple)" : "transparent",
                  color: view === v ? "#fff" : "var(--muted)",
                }}
              >
                {v === "state" ? "State" : "Center"}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "state" ? (
        <StateHeatmap stateAgg={stateAgg} bare />
      ) : (
        <CenterEnrollmentList centerAgg={centerAgg || []} />
      )}
    </div>
  );
}
