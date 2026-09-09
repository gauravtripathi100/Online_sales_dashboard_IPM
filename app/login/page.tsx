"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Brand />
        <div className="panel" style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: 6 }}>
              Team Login
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Sign in with your phone number and password.</div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label>Phone Number</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted-dim)" }}>
          Don&apos;t have an account? Ask an admin to add you from the Admin panel.
        </div>
      </div>
    </div>
  );
}
