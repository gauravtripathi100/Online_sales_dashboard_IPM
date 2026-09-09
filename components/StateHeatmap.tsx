"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "/maps/india_states_topo.json";

function colorFor(count: number, max: number): string {
  if (!count || max === 0) return "#1B1B26";
  const t = Math.min(1, count / max);
  // Interpolate from muted panel color to purple accent.
  const from = { r: 0x1b, g: 0x1b, b: 0x26 };
  const to = { r: 0x7c, g: 0x5c, b: 0xfc };
  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);
  return `rgb(${r},${g},${b})`;
}

export default function StateHeatmap({ stateAgg }: { stateAgg: { name: string; count: number }[] }) {
  const [hover, setHover] = useState<{ name: string; count: number; x: number; y: number } | null>(null);

  const map = useMemo(() => {
    const m = new Map<string, number>();
    stateAgg.forEach((s) => m.set(s.name, s.count));
    return m;
  }, [stateAgg]);

  const max = useMemo(() => Math.max(1, ...stateAgg.map((s) => s.count)), [stateAgg]);

  return (
    <div className="panel" style={{ position: "relative" }}>
      <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 16px" }}>
        Enrollments by State
      </h2>
      <div style={{ position: "relative" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [82, 22], scale: 1000 }}
          width={760}
          height={640}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name: string = geo.properties.NAME_1;
                const count = map.get(name) || 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(evt) => {
                      setHover({ name, count, x: evt.clientX, y: evt.clientY });
                    }}
                    onMouseMove={(evt) => {
                      setHover((h) => (h ? { ...h, x: evt.clientX, y: evt.clientY } : h));
                    }}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      default: { fill: colorFor(count, max), stroke: "#0A0A11", strokeWidth: 0.6, outline: "none" },
                      hover: { fill: "#F2C24B", stroke: "#0A0A11", strokeWidth: 0.6, outline: "none", cursor: "pointer" },
                      pressed: { fill: "#F2C24B", stroke: "#0A0A11", strokeWidth: 0.6, outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {hover && (
          <div
            style={{
              position: "fixed",
              left: hover.x + 14,
              top: hover.y + 14,
              background: "#12121B",
              border: "1px solid #25252F",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              pointerEvents: "none",
              zIndex: 50,
            }}
          >
            <div style={{ fontWeight: 700, color: "#F2F3F6" }}>{hover.name}</div>
            <div className="mono" style={{ color: "var(--muted)" }}>
              {hover.count} enrollment{hover.count === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
        <span>0</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(90deg, #1B1B26, #7C5CFC)" }} />
        <span>{max}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        {stateAgg.slice(0, 10).map((s) => (
          <div
            key={s.name}
            className="mono"
            style={{
              fontSize: 11.5,
              background: "var(--input-bg)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "5px 12px",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{s.name}</span>
            <span style={{ color: "var(--muted)" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
