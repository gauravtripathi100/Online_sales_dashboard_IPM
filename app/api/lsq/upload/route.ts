import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { parseLsqFile, extractOwnerRows } from "@/lib/lsqLogic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const monthKey = formData.get("monthKey") as string | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (!monthKey) {
      return NextResponse.json({ error: "Please choose which month this LSQ export is for." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawRows = parseLsqFile(buffer, file.name);
    const ownerRows = extractOwnerRows(rawRows);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM lsq_owners WHERE month_key = $1", [monthKey]);

      const text = `
        INSERT INTO lsq_owners (month_key, student_id, owner)
        VALUES ${ownerRows
          .map((_, i) => `($1,$${i * 2 + 2},$${i * 2 + 3})`)
          .join(",")}
      `;
      const values: any[] = [monthKey];
      ownerRows.forEach((r) => values.push(r.studentId, r.owner));
      await client.query(text, values);

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({
      monthKey,
      totalRows: rawRows.length,
      matchedRows: ownerRows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "LSQ upload failed." }, { status: 500 });
  }
}
