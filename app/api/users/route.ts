import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const users = await query(
    "SELECT id, phone, name, role, created_at FROM users ORDER BY created_at ASC"
  );
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  try {
    const { name, phone, password, role } = await req.json();
    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Name, phone and password are required." }, { status: 400 });
    }
    const safeRole = role === "admin" ? "admin" : "member";
    const hash = await hashPassword(password);
    const rows = await query<{ id: number }>(
      "INSERT INTO users (phone, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [String(phone).trim(), name, hash, safeRole]
    );
    return NextResponse.json({ id: rows[0].id });
  } catch (err: any) {
    if (String(err.message).includes("duplicate key")) {
      return NextResponse.json({ error: "A user with that phone number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Could not create user." }, { status: 500 });
  }
}
