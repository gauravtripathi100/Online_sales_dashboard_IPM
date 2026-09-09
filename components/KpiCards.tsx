"use client";

import { Aggregates } from "@/lib/types";

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
function pct(a: number, b: number): number | null {
  if (!b) return null;
  return ((a - b) / b) * 100;
}
function delta(curr: number, prev?: number | null) {
  if (prev === null || prev === undefined) return { cls: "flat", text: "no prior month" };
  const p = pct(curr, prev);
  if (p === null) return { cls: "flat", text: "—" };
  const cls = p > 0.05 ? "up" : p < -0.05 ? "down" : "flat";
  const arrow = p > 0.05 ? "▲" : p < -0.05 ? "▼" : "—";
  return { cls, text: `${arrow} ${Math.abs(p).toFixed(1)}% vs last mo.` };
}

const COLORS: Record<string, string> = { up: "var(--green)", down: "var(--coral)", flat: "var(--muted)" };

function Card({ label, value, kc, deltaInfo, sub }: { label: string; value: string; kc: string; deltaInfo?: { cls: string; text: string }; sub?: string }) {
  return (
    <div className="panel" style={{ borderColor: kc, borderWidth: 1.5 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600, marginBottom: 14 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 27, fontWeight: 700, lineHeight: 1 }}>
        {value}
      </div>
      {deltaInfo ? (
        <div className="mono" style={{ fontSize: 12, marginTop: 12, fontWeight: 600, color: COLORS[deltaInfo.cls] }}>
          {deltaInfo.text}
        </div>
      ) : sub ? (
        <div className="mono" style={{ fontSize: 12, marginTop: 12, fontWeight: 600, color: "var(--muted)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function KpiCards({ current, previous }: { current: Aggregates; previous?: Aggregates | null }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <Card label="Online Revenue" value={fmtINR(current.revenue)} kc="var(--purple)" deltaInfo={delta(current.revenue, previous?.revenue)} />
      <Card label="Enrollments" value={fmtNum(current.count)} kc="var(--blue)" deltaInfo={delta(current.count, previous?.count)} />
      <Card label="Avg. Deal Size" value={fmtINR(current.avg)} kc="var(--green)" deltaInfo={delta(current.avg, previous?.avg)} />
      <Card label="Daily Pace" value={fmtINR(current.pace) + "/day"} kc="var(--yellow)" sub="₹ per day" />
    </div>
  );
}

export { fmtINR, fmtNum, pct };
