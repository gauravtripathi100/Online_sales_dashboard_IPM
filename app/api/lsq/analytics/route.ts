import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

type JoinedRow = {
  net_amount: string | number;
  owner: string | null;
};

export type OwnerAggRow = { name: string; sum: number; count: number };

function aggregate(rows: JoinedRow[]): OwnerAggRow[] {
  const map = new Map<string, { sum: number; count: number }>();
  rows.forEach((r) => {
    const key = r.owner || "Not Found in LSQ";
    const entry = map.get(key) || { sum: 0, count: 0 };
    entry.sum += Number(r.net_amount);
    entry.count += 1;
    map.set(key, entry);
  });
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.sum - a.sum);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "Missing required 'month' query param." }, { status: 400 });
  }

  try {
    // LEFT JOIN so online sales with no LSQ match still show up (as "Not Found in LSQ")
    // rather than silently disappearing.
    const rows = await query<JoinedRow>(
      `SELECT sr.net_amount, lo.owner
       FROM sale_rows sr
       LEFT JOIN lsq_owners lo ON lo.student_id = sr.student_id AND lo.month_key = sr.month_key
       WHERE sr.month_key = $1 AND sr.channel = 'online'`,
      [month]
    );

    const lsqUploaded = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM lsq_owners WHERE month_key = $1`,
      [month]
    );

    const ownerAgg = aggregate(rows);
    const totalRevenue = rows.reduce((s, r) => s + Number(r.net_amount), 0);
    const totalCount = rows.length;
    const notFoundCount = ownerAgg.find((o) => o.name === "Not Found in LSQ")?.count || 0;

    return NextResponse.json({
      ownerAgg,
      totalRevenue,
      totalCount,
      notFoundCount,
      lsqUploadedCount: Number(lsqUploaded[0]?.count || 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load sales person data." }, { status: 500 });
  }
}
