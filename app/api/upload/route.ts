import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query, pool } from "@/lib/db";
import { parseFileBuffer, processRows } from "@/lib/salesLogic";

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

      // Replace any existing rows for this month so re-uploads don't double-count.
      await client.query("DELETE FROM sale_rows WHERE month_key = $1", [result.monthKey]);

      const dateParams: (string | null)[] = result.includedRows.map((r) =>
        r.date ? r.date.toISOString().slice(0, 10) : null
      );

      const insertText = `
        INSERT INTO sale_rows (upload_id, month_key, course, offering_type, state, net_amount, enrollment_date)
        VALUES ${result.includedRows
          .map((_, i) => {
            const base = i * 7;
            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7})`;
          })
          .join(",")}
      `;
      const insertValues: any[] = [];
      result.includedRows.forEach((r, i) => {
        insertValues.push(
          uploadId,
          result.monthKey,
          r.course,
          r.offering,
          r.state,
          r.net,
          dateParams[i]
        );
      });
      await client.query(insertText, insertValues);

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
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}
