import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName, verifySession } from "./lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const token = req.cookies.get(getCookieName())?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    await verifySession(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/dashboard/:path*"] };
