import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query, pool } from "@/lib/db";
import { parseFileBuffer, processRows, IncludedRow } from "@/lib/salesLogic";

function buildInsert(uploadId: number, monthKey: string, rows: IncludedRow[], channel: "online" | "offline") {
  if (!rows.length) return null;
  const dateParams = rows.map((r) => (r.date ? r.date.toISOString().slice(0, 10) : null));
  const text = `
    INSERT INTO sale_rows (upload_id, month_key, channel, course, offering_type, state, net_amount, enrollment_date, centre_name, pos_type)
    VALUES ${rows
      .map((_, i) => {
        const base = i * 10;
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10})`;
      })
      .join(",")}
  `;
  const values: any[] = [];
  rows.forEach((r, i) => {
    values.push(uploadId, monthKey, channel, r.course, r.offering, r.state, r.net, dateParams[i], r.centre, r.posType);
  });
  return { text, values };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const overrideMonthLabel = (formData.get("monthLabel") as string | null) || undefined;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawRows = parseFileBuffer(buffer, file.name);
    const result = processRows(rawRows, overrideMonthLabel);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const uploadRows = await client.query(
        `INSERT INTO uploads (month_key, month_label, filename, total_rows, excluded_offline, excluded_zero, included_count, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          result.monthKey,
          result.monthLabel,
          file.name,
          result.totalRows,
          result.excludedOffline,
          result.excludedZero,
          result.includedRows.length,
          session.userId,
        ]
      );
      const uploadId = uploadRows.rows[0].id;

      // Replace any existing rows for this month (both channels) so re-uploads don't double-count.
      await client.query("DELETE FROM sale_rows WHERE month_key = $1", [result.monthKey]);

      const onlineInsert = buildInsert(uploadId, result.monthKey, result.includedRows, "online");
      if (onlineInsert) await client.query(onlineInsert.text, onlineInsert.values);

      const offlineInsert = buildInsert(uploadId, result.monthKey, result.offlineRows, "offline");
      if (offlineInsert) await client.query(offlineInsert.text, offlineInsert.values);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({
      monthKey: result.monthKey,
      monthLabel: result.monthLabel,
      totalRows: result.totalRows,
      excludedOffline: result.excludedOffline,
      excludedZero: result.excludedZero,
      includedCount: result.includedRows.length,
      offlineCount: result.offlineRows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}
