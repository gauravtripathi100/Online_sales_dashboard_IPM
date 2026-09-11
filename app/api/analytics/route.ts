import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { computeAggregates, SaleRowDB } from "@/lib/salesLogic";

async function loadMonth(
  monthKey: string,
  channel: "online" | "offline",
  filters: { state?: string; offering?: string; course?: string; center?: string }
) {
  const conditions = ["month_key = $1", "channel = $2"];
  const params: any[] = [monthKey, channel];
  if (filters.state) {
    params.push(filters.state);
    conditions.push(`state = $${params.length}`);
  }
  if (filters.offering) {
    params.push(filters.offering);
    conditions.push(`offering_type = $${params.length}`);
  }
  if (filters.course) {
    params.push(filters.course);
    conditions.push(`course = $${params.length}`);
  }
  if (filters.center) {
    params.push(filters.center);
    conditions.push(`centre_name = $${params.length}`);
  }
  const rows = await query<SaleRowDB>(
    `SELECT course, offering_type, state, net_amount, enrollment_date::text as enrollment_date, centre_name, pos_type
     FROM sale_rows WHERE ${conditions.join(" AND ")}`,
    params
  );
  const uploadMeta = await query<{
    month_label: string;
    total_rows: number;
    excluded_offline: number;
    excluded_zero: number;
    included_count: number;
  }>(
    `SELECT month_label, total_rows, excluded_offline, excluded_zero, included_count
     FROM uploads WHERE month_key = $1 ORDER BY uploaded_at DESC LIMIT 1`,
    [monthKey]
  );
  return {
    aggregates: computeAggregates(rows),
    meta: uploadMeta[0] || null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const compareMonth = searchParams.get("compareMonth");
  const state = searchParams.get("state") || undefined;
  const offering = searchParams.get("offering") || undefined;
  const course = searchParams.get("course") || undefined;
  const center = searchParams.get("center") || undefined;
  const channelParam = searchParams.get("channel");
  const channel: "online" | "offline" = channelParam === "offline" ? "offline" : "online";

  if (!month) {
    return NextResponse.json({ error: "Missing required 'month' query param." }, { status: 400 });
  }

  try {
    const current = await loadMonth(month, channel, { state, offering, course, center });
    let previous = null;
    if (compareMonth) {
      previous = await loadMonth(compareMonth, channel, { state, offering, course, center });
    }
    return NextResponse.json({ current, previous });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load analytics." }, { status: 500 });
  }
}
