"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function TopNav({ user }: { user: { name: string; role: "admin" | "member" } }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const linkStyle = (active: boolean) => ({
    fontSize: 13,
    fontWeight: 600,
    color: active ? "#fff" : "var(--muted)",
    padding: "8px 4px",
    borderBottom: active ? "2px solid var(--purple)" : "2px solid transparent",
  });

  return (
    <div style={{ borderBottom: "1px solid var(--line)", background: "var(--panel)" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/brand/logo-white.png" alt="toprankers" width={22} height={25} />
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
              SUPERGRADS
            </span>
          </div>
          <nav style={{ display: "flex", gap: 18 }}>
            <Link href="/dashboard" style={linkStyle(pathname === "/dashboard")}>
              Dashboard
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" style={linkStyle(pathname === "/admin")}>
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className={`badge ${user.role}`}>{user.role}</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{user.name}</span>
          <button className="btn ghost sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
