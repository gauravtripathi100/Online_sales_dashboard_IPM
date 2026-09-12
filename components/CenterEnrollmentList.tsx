"use client";

const PALETTE = ["#7C5CFC", "#54A7E5", "#6AD09D", "#F2C24B", "#EC666C", "#3E5C76", "#8FA998", "#B08968"];

export default function CenterEnrollmentList({ centerAgg }: { centerAgg: { name: string; count: number }[] }) {
  const sorted = [...centerAgg].sort((a, b) => b.count - a.count);
  const max = sorted.length ? sorted[0].count : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
      {sorted.map((c, i) => {
        const width = max ? Math.max(4, (c.count / max) * 100) : 0;
        const color = PALETTE[i % PALETTE.length];
        return (
          <div key={c.name} style={{ display: "grid", gridTemplateColumns: "26px 1fr auto", gap: 12, alignItems: "center" }}>
            <div className="mono" style={{ fontSize: 12, color: "var(--muted-dim)", textAlign: "right" }}>
              {i + 1}
            </div>
            <div style={{ background: "var(--input-bg)", border: "1px solid var(--line)", borderRadius: 8, height: 32, position: "relative", overflow: "hidden" }}>
              <div style={{ background: color, height: "100%", width: `${width}%`, borderRadius: "8px 0 0 8px", transition: "width .4s ease" }} />
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: 0,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text)",
                  maxWidth: "72%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, textAlign: "right", minWidth: 70, color: "var(--text)" }}>
              {c.count} {c.count === 1 ? "enrollment" : "enrollments"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
