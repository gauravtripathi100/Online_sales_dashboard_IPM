import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { PRODUCT_DISPLAY_ORDER } from "@/lib/productLogic";

type ProductRowDB = {
  product: string;
  product_channel: string | null;
  net_amount: string | number;
};

export type ProductAggRow = {
  product: string;
  channel: "online" | "offline" | null;
  count: number;
  sum: number;
  arpu: number;
};

function aggregate(rows: ProductRowDB[]): ProductAggRow[] {
  const map = new Map<string, { count: number; sum: number }>();
  rows.forEach((r) => {
    const key = `${r.product}|${r.product_channel || ""}`;
    const entry = map.get(key) || { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += Number(r.net_amount);
    map.set(key, entry);
  });

  // Always return every canonical row (even at zero), in the fixed display order,
  // so the table matches the shape of the original manual sheet every time.
  const out: ProductAggRow[] = PRODUCT_DISPLAY_ORDER.map(({ product, channel }) => {
    const key = `${product}|${channel || ""}`;
    const entry = map.get(key);
    const count = entry?.count || 0;
    const sum = entry?.sum || 0;
    return { product, channel, count, sum, arpu: count ? sum / count : 0 };
  });

  // Drop the two "Others" rows entirely if they're empty — keeps the table clean when
  // classification fully accounts for every row, but still surfaces them if not.
  return out.filter((r) => !(r.product === "Others" && r.count === 0));
}

async function loadMonth(monthKey: string) {
  const rows = await query<ProductRowDB>(
    `SELECT product, product_channel, net_amount FROM product_rows WHERE month_key = $1`,
    [monthKey]
  );
  const uploadMeta = await query<{ month_label: string }>(
    `SELECT month_label FROM uploads WHERE month_key = $1 ORDER BY uploaded_at DESC LIMIT 1`,
    [monthKey]
  );
  return {
    products: aggregate(rows),
    monthLabel: uploadMeta[0]?.month_label || monthKey,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const compareMonth = searchParams.get("compareMonth");

  if (!month) {
    return NextResponse.json({ error: "Missing required 'month' query param." }, { status: 400 });
  }

  try {
    const current = await loadMonth(month);
    let previous = null;
    if (compareMonth) {
      previous = await loadMonth(compareMonth);
    }
    return NextResponse.json({ current, previous });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load product data." }, { status: 500 });
  }
}
