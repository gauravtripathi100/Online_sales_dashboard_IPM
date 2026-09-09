"use client";

import { useRef, useState } from "react";

export default function UploadPanel({ onUploaded }: { onUploaded: (monthKey: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setFileName(file.name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        setLoading(false);
        return;
      }
      setSuccess(
        `${data.monthLabel}: ${data.totalRows} rows → ${data.excludedOffline} offline excluded, ${data.excludedZero} zero-value excluded → ${data.includedCount} online sales saved.`
      );
      onUploaded(data.monthKey);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) upload(f);
  }

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <h2 className="mono" style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", margin: 0 }}>
          Upload 634 Report
        </h2>
        <span style={{ fontSize: 12, color: "var(--muted-dim)" }} className="mono">
          .csv / .xlsx
        </span>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        style={{
          background: "var(--input-bg)",
          border: `1px solid ${drag ? "var(--purple)" : "var(--line)"}`,
          borderRadius: 9,
          padding: "18px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: fileName ? "var(--text)" : "var(--muted-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loading ? "Processing…" : fileName || "Click or drag a file to upload"}
        </span>
        <span className="btn primary sm" style={{ pointerEvents: "none" }}>
          {loading ? "…" : "Upload"}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted-dim)" }}>
        Re-uploading a file for a month you&apos;ve already uploaded replaces that month&apos;s data.
      </div>
    </div>
  );
}
