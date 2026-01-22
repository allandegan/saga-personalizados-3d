import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCookieName } from "./lib/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Sempre liberar rotas públicas e todas APIs de auth
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ✅ Proteger apenas /dashboard
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(getCookieName())?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
