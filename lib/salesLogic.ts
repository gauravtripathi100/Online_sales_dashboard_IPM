import Papa from "papaparse";
import * as XLSX from "xlsx";
import { normalizeStateName } from "./stateNames";
import { classifyProduct, ProductRow } from "./productLogic";

// ARPU is only meaningful over real course batches. Cheap, high-volume add-ons
// (Test Series, GMB, Interview Prep, Study Material, Early Bird) and unclassified
// rows ("Others") would otherwise drag a blended ARPU down to something misleading.
const GOLD_PRODUCTS = new Set(["1 Year", "2 Year", "Dropper", "Crash", "Self Paced", "IIM B/IIM K"]);

export type IncludedRow = {
  course: string;
  offering: string;
  state: string;
  net: number;
  date: Date | null;
  centre: string;
  posType: string;
};

export type ProcessResult = {
  monthKey: string;
  monthLabel: string;
  totalRows: number;
  excludedOffline: number;
  excludedZero: number;
  includedRows: IncludedRow[];
  offlineRows: IncludedRow[];
  productRows: ProductRow[];
};

const REQUIRED_KEYS = [
  "pos",
  "centre name",
  "state",
  "offering type",
  "course name",
  "net amount",
  "enrollment date",
];

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

function parseDateLoose(str: string): Date | null {
  if (!str) return null;
  const datePart = str.split(" ")[0].trim();
  const parts = datePart.split(/[-/]/);
  if (parts.length !== 3) return null;
  let y: number, m: number, d: number;
  if (parts[0].length === 4) {
    y = +parts[0];
    m = +parts[1];
    d = +parts[2];
  } else {
    d = +parts[0];
    m = +parts[1];
    y = +parts[2];
  }
  if (!y || !m) return null;
  const dt = new Date(Date.UTC(y, m - 1, d || 1));
  return isNaN(dt.getTime()) ? null : dt;
}

export function parseFileBuffer(buffer: Buffer, filename: string): Record<string, unknown>[] {
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

export function processRows(
  rawRows: Record<string, unknown>[],
  overrideMonthLabel?: string
): ProcessResult {
  if (!rawRows.length) throw new Error("The file has no rows.");

  const firstKeys = new Set(Object.keys(rawRows[0]).map(normalizeKey));
  const missing = REQUIRED_KEYS.filter((r) => !firstKeys.has(r));
  if (missing.length) {
    throw new Error(
      `Missing expected column(s): ${missing.join(", ")}. Check this is a 634-format export.`
    );
  }

  let totalRows = 0;
  let excludedOffline = 0;
  let excludedZero = 0;
  const included: IncludedRow[] = [];
  const offline: IncludedRow[] = [];
  const products: ProductRow[] = [];
  const monthCounts: Record<string, number> = {};

  for (const raw of rawRows) {
    totalRows++;
    const acc = buildAccessor(raw);
    const pos = acc.get("pos").toUpperCase();
    const centre = acc.get("centre name").toUpperCase();
    const isOnline = (pos === "ONLINE" || pos === "HO SUPPORT") && centre === "NA";
    const netAmt = parseFloat(acc.get("net amount")) || 0;
    const dateStr = acc.get("enrollment date");
    const d = parseDateLoose(dateStr);
    if (d) {
      const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthCounts[mk] = (monthCounts[mk] || 0) + 1;
    }

    // Product classification (for the Product Dashboard) runs independently of the
    // Online/Offline Revenue channel logic below — it looks at every row in the file
    // (any POS) and only requires NET Amount > ₹100, since a physical center can sell
    // an "online" product and vice versa.
    if (netAmt > 100) {
      const { product, channel } = classifyProduct(acc.get("course name"));
      products.push({ product, channel, net: netAmt, date: d });
    }

    if (!isOnline) {
      excludedOffline++;
      // Also capture genuine offline-center sales so the same upload can
      // power an Offline Revenue dashboard later, without needing to
      // re-upload this file. Offline requires POS = COCO/FOFO AND a real
      // centre name (not blank, not "NA" — that combination means the row
      // doesn't cleanly belong to either channel and is left out of both).
      const rawCentre = acc.get("centre name");
      const hasRealCentre = rawCentre.length > 0 && centre !== "NA";
      if ((pos === "COCO" || pos === "FOFO") && hasRealCentre && netAmt > 100) {
        offline.push({
          course: acc.get("course name") || "Unspecified",
          offering: acc.get("offering type") || "Unspecified",
          state: normalizeStateName(acc.get("state") || "Unspecified"),
          net: netAmt,
          date: d,
          centre: rawCentre,
          posType: pos,
        });
      }
      continue;
    }
    // Amounts of ₹100 or less are placeholder/token transactions (demo unlocks,
    // nominal booking fees, etc.) — not real sales, so they're excluded here
    // alongside genuine ₹0 rows.
    if (netAmt <= 100) {
      excludedZero++;
      continue;
    }
    included.push({
      course: acc.get("course name") || "Unspecified",
      offering: acc.get("offering type") || "Unspecified",
      state: normalizeStateName(acc.get("state") || "Unspecified"),
      net: netAmt,
      date: d,
      centre: "NA",
      posType: pos,
    });
  }

  if (!included.length && !offline.length) {
    throw new Error(
      "No sales rows survived the filters (online: POS=Online/HO Support + Centre=NA; offline: POS=COCO/FOFO + a real centre name — both also require NET Amount>₹100). Check the file contents."
    );
  }

  let monthKey: string | null = null;
  let best = -1;
  for (const [mk, c] of Object.entries(monthCounts)) {
    if (c > best) {
      best = c;
      monthKey = mk;
    }
  }
  let monthLabel = overrideMonthLabel || "";
  if (!monthLabel && monthKey) {
    const [y, m] = monthKey.split("-").map(Number);
    monthLabel = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  if (!monthKey) monthKey = "unknown";
  if (!monthLabel) monthLabel = "Unlabeled period";

  return {
    monthKey,
    monthLabel,
    totalRows,
    excludedOffline,
    excludedZero,
    includedRows: included,
    offlineRows: offline,
    productRows: products,
  };
}

// ---- Aggregation helpers used by the analytics API (operate on DB rows) ----

export type SaleRowDB = {
  course: string;
  offering_type: string;
  state: string;
  net_amount: string | number;
  enrollment_date: string | null;
  centre_name: string | null;
  pos_type: string | null;
};

export type Aggregates = {
  revenue: number;
  count: number;
  avg: number;
  goldRevenue: number;
  goldCount: number;
  pace: number;
  daySpan: number;
  courseAgg: { name: string; sum: number; count: number }[];
  offeringAgg: { name: string; sum: number; count: number }[];
  stateAgg: { name: string; count: number }[];
  centerAgg: { name: string; sum: number; count: number }[];
  posTypeAgg: { name: string; sum: number; count: number }[];
};

export function computeAggregates(rows: SaleRowDB[]): Aggregates {
  const nets = rows.map((r) => Number(r.net_amount));
  const revenue = nets.reduce((s, v) => s + v, 0);
  const count = rows.length;

  // ARPU ("avg") is computed only over Gold-classified rows — a different,
  // narrower numerator and denominator than the overall revenue/count above,
  // which stay as full totals across every product.
  let goldRevenue = 0;
  let goldCount = 0;
  rows.forEach((r) => {
    const { product } = classifyProduct(r.course);
    if (GOLD_PRODUCTS.has(product)) {
      goldRevenue += Number(r.net_amount);
      goldCount += 1;
    }
  });
  const avg = goldCount ? goldRevenue / goldCount : 0;

  const dates = rows
    .map((r) => (r.enrollment_date ? new Date(r.enrollment_date) : null))
    .filter((d): d is Date => !!d);
  let daySpan = 1;
  if (dates.length) {
    const min = Math.min(...dates.map((d) => d.getTime()));
    const max = Math.max(...dates.map((d) => d.getTime()));
    daySpan = Math.max(1, Math.round((max - min) / (1000 * 60 * 60 * 24)) + 1);
  }
  const pace = revenue / daySpan;

  function groupSum(keyFn: (r: SaleRowDB) => string) {
    const map = new Map<string, { sum: number; count: number }>();
    rows.forEach((r) => {
      const k = keyFn(r);
      const entry = map.get(k) || { sum: 0, count: 0 };
      entry.sum += Number(r.net_amount);
      entry.count += 1;
      map.set(k, entry);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sum - a.sum);
  }
  function groupCount(keyFn: (r: SaleRowDB) => string) {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const k = keyFn(r);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  return {
    revenue,
    count,
    avg,
    goldRevenue,
    goldCount,
    pace,
    daySpan,
    courseAgg: groupSum((r) => r.course),
    offeringAgg: groupSum((r) => r.offering_type),
    stateAgg: groupCount((r) => r.state),
    centerAgg: groupSum((r) => r.centre_name || "Unspecified"),
    posTypeAgg: groupSum((r) => r.pos_type || "Unspecified"),
  };
}
