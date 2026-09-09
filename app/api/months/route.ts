import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await query<{ month_key: string; month_label: string }>(
    `SELECT DISTINCT ON (month_key) month_key, month_label
     FROM uploads
     ORDER BY month_key DESC, uploaded_at DESC`
  );
  return NextResponse.json({ months: rows });
}
