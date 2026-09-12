import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TopNav from "@/components/TopNav";
import Link from "next/link";

type CardStatus = "live" | "soon";
const CARDS: { href: string; kc: string; title: string; desc: string; status: CardStatus }[] = [
  {
    href: "/dashboard/online",
    kc: "var(--purple)",
    title: "Online Revenue",
    desc: "Course-wise, offering-wise, and state-wise breakdown of online enrollments — filtered from your uploaded 634 report.",
    status: "live" as const,
  },
  {
    href: "/dashboard/offline",
    kc: "var(--blue)",
    title: "Offline Revenue",
    desc: "Center-wise (COCO/FOFO) revenue and enrollments from the same uploaded report.",
    status: "live" as const,
  },
  {
    href: "/dashboard/insights",
    kc: "var(--yellow)",
    title: "Product Dashboard",
    desc: "Unit sold, revenue, and ARPU by product (1 Year, 2 Year, Dropper, Test Series, etc.) — classified from Course Name, split Online/Offline.",
    status: "live" as const,
  },
];

export default async function DashboardHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <TopNav user={{ name: session.name, role: session.role }} />
      <div className="wrap">
        <div style={{ marginBottom: 32 }}>
          <h1
            className="mono"
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", margin: "0 0 8px" }}
          >
            Choose a Dashboard
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>
            One 634 report upload powers all three — upload it once from any dashboard below.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {CARDS.map((card) => {
            const inner = (
              <div
                className="panel"
                style={{
                  borderColor: card.kc,
                  borderWidth: 1.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  cursor: card.status === "live" ? "pointer" : "default",
                  opacity: card.status === "soon" ? 0.75 : 1,
                  transition: "transform .15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: card.kc,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0A0A11",
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                    className="mono"
                  >
                    {card.title[0]}
                  </div>
                  {card.status === "soon" && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                        color: "var(--muted)",
                        background: "var(--input-bg)",
                        border: "1px solid var(--line)",
                        borderRadius: 6,
                        padding: "3px 8px",
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "var(--text)" }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{card.desc}</div>
                </div>
                {card.status === "live" && (
                  <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: card.kc, marginTop: "auto" }}>
                    OPEN →
                  </div>
                )}
              </div>
            );
            return card.status === "live" ? (
              <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                {inner}
              </Link>
            ) : (
              <div key={card.href}>{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
