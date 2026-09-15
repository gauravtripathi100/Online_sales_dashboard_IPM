import Papa from "papaparse";
import * as XLSX from "xlsx";

export type LsqOwnerRow = {
  studentId: string;
  owner: string;
};

function normalizeKey(k: string): string {
  return String(k).replace(/^\uFEFF/, "").trim().toLowerCase();
}
function cleanVal(v: unknown): string {
  return v === undefined || v === null ? "" : String(v).trim();
}
function buildAccessor(rawRow: Record<string, unknown>) {
  const map: Record<string, unknown> = {};
  Object.keys(rawRow).forEach((k) => {
    map[normalizeKey(k)] = rawRow[k];
  });
  return { get: (name: string) => cleanVal(map[name]) };
}

// Student ID appears as a float in the LSQ export (e.g. "6842813.0") but as a plain
// integer in the 634 report (e.g. "6842813"). Normalizing both to the same plain
// integer string form is what makes the join reliable.
function normalizeStudentId(v: string): string {
  const cleaned = v.replace(/^["']+|["']+$/g, "").trim();
  if (!cleaned) return "";
  const num = parseFloat(cleaned);
  if (isNaN(num)) return cleaned;
  return String(Math.round(num));
}

export function parseLsqFile(buffer: Buffer, filename: string): Record<string, unknown>[] {
  const isXlsx = /\.xlsx?$/i.test(filename);
  if (isXlsx) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data as Record<string, unknown>[];
}

export function extractOwnerRows(rawRows: Record<string, unknown>[]): LsqOwnerRow[] {
  if (!rawRows.length) throw new Error("The file has no rows.");

  const firstKeys = new Set(Object.keys(rawRows[0]).map(normalizeKey));
  if (!firstKeys.has("student id")) {
    throw new Error("Missing expected column 'Student ID'. Check this is an LSQ export.");
  }
  if (!firstKeys.has("owner")) {
    throw new Error("Missing expected column 'Owner'. Check this is an LSQ export.");
  }

  const out: LsqOwnerRow[] = [];
  for (const raw of rawRows) {
    const acc = buildAccessor(raw);
    const studentId = normalizeStudentId(acc.get("student id"));
    const owner = acc.get("owner");
    if (!studentId || !owner) continue;
    out.push({ studentId, owner });
  }

  if (!out.length) {
    throw new Error("No usable rows found — every row is missing a Student ID or Owner value.");
  }

  return out;
}
