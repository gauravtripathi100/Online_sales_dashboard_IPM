import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await query<{
    month_key: string;
    month_label: string;
    total_rows: number;
    included_count: number;
    uploaded_at: string;
    uploaded_by_name: string | null;
  }>(
    `SELECT DISTINCT ON (u.month_key)
       u.month_key, u.month_label, u.total_rows, u.included_count, u.uploaded_at,
       usr.name as uploaded_by_name
     FROM uploads u
     LEFT JOIN users usr ON usr.id = u.uploaded_by
     ORDER BY u.month_key DESC, u.uploaded_at DESC`
  );
  return NextResponse.json({ uploads: rows });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const monthKey = searchParams.get("monthKey");
  if (!monthKey) {
    return NextResponse.json({ error: "Missing required 'monthKey' query param." }, { status: 400 });
  }

  // sale_rows has ON DELETE CASCADE from uploads, so deleting the upload rows
  // for this month automatically removes all associated sale data too.
  await query("DELETE FROM uploads WHERE month_key = $1", [monthKey]);

  return NextResponse.json({ ok: true });
}
