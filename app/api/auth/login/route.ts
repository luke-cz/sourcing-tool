import { NextRequest, NextResponse } from "next/server";
import { hashPassword, SESSION_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    // No password configured — always succeed
    return NextResponse.json({ ok: true });
  }

  if (password !== sitePassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const hash = await hashPassword(sitePassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, hash, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    // secure: true  // uncomment when deployed over HTTPS
  });
  return res;
}
