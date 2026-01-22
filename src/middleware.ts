import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName } from "./lib/session";

function getPublicOrigin(req: NextRequest) {
  const xfProto = req.headers.get("x-forwarded-proto");
  const xfHost = req.headers.get("x-forwarded-host");
  const host = xfHost || req.headers.get("host") || "localhost";
  const proto = xfProto || "https";
  return `${proto}://${host}`;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // liberar rotas públicas e assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/login-form") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // ✅ No Edge, não valida JWT (evita loop). Só checa se tem cookie.
  const token = req.cookies.get(getCookieName())?.value;
  if (!token) {
    const origin = getPublicOrigin(req);
    return NextResponse.redirect(new URL("/login", origin));
  }

  // raiz -> manda pro dashboard
  if (pathname === "/") {
    const origin = getPublicOrigin(req);
    return NextResponse.redirect(new URL("/dashboard/products", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
