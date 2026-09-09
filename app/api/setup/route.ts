import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";

// One-time bootstrap: creates the first Admin account.
// Only works while the users table is empty, and only if the caller
// supplies SETUP_SECRET (set this in your env vars, and remove/rotate
// it after you've created your first admin, if you like).
export async function POST(req: NextRequest) {
  try {
    const { secret, name, phone, password } = await req.json();

    const expected = process.env.SETUP_SECRET;
    if (!expected) {
      return NextResponse.json(
        { error: "SETUP_SECRET is not configured on the server." },
        { status: 500 }
      );
    }
    if (secret !== expected) {
      return NextResponse.json({ error: "Invalid setup secret." }, { status: 403 });
    }
    if (!name || !phone || !password) {
      return NextResponse.json({ error: "Name, phone and password are required." }, { status: 400 });
    }

    const existing = await query<{ count: string }>("SELECT COUNT(*)::text as count FROM users");
    if (Number(existing[0].count) > 0) {
      return NextResponse.json(
        { error: "Setup already completed — users already exist. Use the admin panel instead." },
        { status: 409 }
      );
    }

    const hash = await hashPassword(password);
    await query(
      "INSERT INTO users (phone, name, password_hash, role) VALUES ($1, $2, $3, 'admin')",
      [String(phone).trim(), name, hash]
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Setup failed." }, { status: 500 });
  }
}
