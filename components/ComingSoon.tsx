import Link from "next/link";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard" className="mono" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
          ← Back to dashboards
        </Link>
      </div>
      <div
        className="panel"
        style={{
          textAlign: "center",
          padding: "70px 30px",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <div
          className="mono"
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".06em",
            color: "var(--muted)",
            background: "var(--input-bg)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "4px 10px",
            marginBottom: 18,
          }}
        >
          Coming Soon
        </div>
        <h1 className="mono" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px", textTransform: "uppercase" }}>
          {title}
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}
