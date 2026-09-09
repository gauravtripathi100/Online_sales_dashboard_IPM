"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Brand from "@/components/Brand";

export default function SetupPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed.");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Brand />
          <div className="panel" style={{ textAlign: "center" }}>
            <div className="success-msg" style={{ marginBottom: 20 }}>
              Admin account created for <b>{phone}</b>. You can now log in.
            </div>
            <button className="btn primary" onClick={() => router.push("/login")}>
              Go to Login
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--muted-dim)" }}>
            This setup page can&apos;t be used again now that a user exists — it&apos;s safe to leave deployed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Brand />
        <div className="panel">
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: 6 }}>
              One-Time Setup
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Create the first Admin account. This only works once — it refuses to run again after any user exists.
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label>Setup Secret</label>
              <input
                type="password"
                placeholder="Your SETUP_SECRET env value"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Your Name</label>
              <input type="text" placeholder="Gaurav Tripathi" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button className="btn primary" type="submit" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? "Creating…" : "Create Admin Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
