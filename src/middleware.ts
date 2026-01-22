import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName } from "./lib/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas / assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/login-form") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ✅ No middleware (Edge) só checa existência do cookie
  const token = req.cookies.get(getCookieName())?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Raiz -> dashboard
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard/products";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
