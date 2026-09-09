import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  const { role } = await req.json();
  if (role !== "admin" && role !== "member") {
    return NextResponse.json({ error: "Role must be 'admin' or 'member'." }, { status: 400 });
  }
  await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const { id } = await params;
  if (Number(id) === session.userId) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }
  await query("DELETE FROM users WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
