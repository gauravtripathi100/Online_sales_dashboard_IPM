import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password are required." }, { status: 400 });
    }

    const rows = await query<{
      id: number;
      phone: string;
      name: string;
      password_hash: string;
      role: "admin" | "member";
    }>("SELECT id, phone, name, password_hash, role FROM users WHERE phone = $1", [
      String(phone).trim(),
    ]);

    if (!rows.length) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 });
    }

    const user = rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed." }, { status: 500 });
  }
}
