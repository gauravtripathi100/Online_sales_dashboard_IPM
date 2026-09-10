"use client";

import { useEffect, useState, useCallback } from "react";

type Member = {
  id: number;
  phone: string;
  name: string;
  role: "admin" | "member";
  created_at: string;
};

type UploadSummary = {
  month_key: string;
  month_label: string;
  total_rows: number;
  included_count: number;
  uploaded_at: string;
  uploaded_by_name: string | null;
};

export default function AdminClient({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [uploadsError, setUploadsError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load team members.");
        return;
      }
      setUsers(json.users);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUploads = useCallback(async () => {
    setUploadsLoading(true);
    try {
      const res = await fetch("/api/uploads");
      const json = await res.json();
      if (!res.ok) {
        setUploadsError(json.error || "Could not load uploaded data.");
        return;
      }
      setUploads(json.uploads);
      setUploadsError(null);
    } finally {
      setUploadsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadUploads();
  }, [load, loadUploads]);

  async function handleDeleteUpload(monthKey: string, monthLabel: string) {
    if (
      !confirm(
        `Delete all uploaded data for ${monthLabel}? This removes every sale record for that month permanently and can't be undone.`
      )
    )
      return;
    setDeletingKey(monthKey);
    try {
      const res = await fetch(`/api/uploads?monthKey=${encodeURIComponent(monthKey)}`, { method: "DELETE" });
      if (res.ok) loadUploads();
      else {
        const json = await res.json();
        alert(json.error || "Could not delete this month's data.");
      }
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Could not add team member.");
        return;
      }
      setName("");
      setPhone("");
      setPassword("");
      setRole("member");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: number) {
    if (!confirm("Remove this team member? They will no longer be able to log in.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function handleRoleToggle(id: number, currentRole: "admin" | "member") {
    const nextRole = currentRole === "admin" ? "member" : "admin";
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1
          className="mono"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase", margin: "0 0 8px" }}
        >
          Team Admin
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5 }}>
          Add or remove team members, and grant or revoke admin access.
        </p>
      </div>

      <div className="panel">
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 16px" }}>
          Add Team Member
        </h2>
        {formError && <div className="error-msg">{formError}</div>}
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="9876543210" />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Set a password"
            />
          </div>
          <div className="field" style={{ minWidth: 140 }}>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add Member"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 16px" }}>
          Team ({users.length})
        </h2>
        {error && <div className="error-msg">{error}</div>}
        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.name} {u.id === currentUserId && <span style={{ color: "var(--muted-dim)", fontWeight: 400 }}>(you)</span>}
                  </td>
                  <td className="mono">{u.phone}</td>
                  <td>
                    <span className={`badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn ghost sm" onClick={() => handleRoleToggle(u.id, u.role)}>
                      {u.role === "admin" ? "Make Member" : "Make Admin"}
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => handleRemove(u.id)}
                      disabled={u.id === currentUserId}
                      title={u.id === currentUserId ? "You can't remove your own account" : undefined}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 6px" }}>
          Uploaded Data
        </h2>
        <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 12.5 }}>
          Delete a month&apos;s uploaded 634 data if it was uploaded by mistake or needs to be redone. This removes every
          sale record for that month permanently.
        </p>
        {uploadsError && <div className="error-msg">{uploadsError}</div>}
        {uploadsLoading ? (
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
        ) : uploads.length === 0 ? (
          <div style={{ color: "var(--muted-dim)", fontSize: 13 }}>No data uploaded yet.</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Month</th>
                <th>Sales Counted</th>
                <th>Uploaded By</th>
                <th>Uploaded At</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.month_key}>
                  <td style={{ fontWeight: 600 }}>{u.month_label}</td>
                  <td className="mono">
                    {u.included_count} / {u.total_rows} rows
                  </td>
                  <td>{u.uploaded_by_name || <span style={{ color: "var(--muted-dim)" }}>Unknown</span>}</td>
                  <td className="mono" style={{ color: "var(--muted)" }}>
                    {new Date(u.uploaded_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn danger sm"
                      onClick={() => handleDeleteUpload(u.month_key, u.month_label)}
                      disabled={deletingKey === u.month_key}
                    >
                      {deletingKey === u.month_key ? "Deleting…" : "Delete Month"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
