import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SALT = "talentscout_v1";
const SESSION_COOKIE = "ts_session";

// Uses Web Crypto API (available in Edge Runtime — no Node.js crypto needed)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${SALT}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: login page, auth API endpoints, and Next.js internals
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const sitePassword = process.env.SITE_PASSWORD;

  // No password configured → open access (local dev)
  if (!sitePassword) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE);
  const expectedHash = await hashPassword(sitePassword);

  if (session?.value === expectedHash) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
