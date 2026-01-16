import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { signSession, getCookieName } from "../../../../lib/session";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");

    if (!username || !password) {
      return NextResponse.redirect(new URL("/login?e=missing", req.url));
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.redirect(new URL("/login?e=invalid", req.url));

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.redirect(new URL("/login?e=invalid", req.url));

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      username: user.username
    });

    const res = NextResponse.redirect(new URL("/dashboard/products", req.url));
    res.cookies.set({
      name: getCookieName(),
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return res;
  } catch (e: any) {
    // isso faz o erro aparecer no Railway Logs
    console.error("LOGIN-FORM ERROR:", e?.message || e, e);

    // e isso faz aparecer na tela como /login?e=server
    return NextResponse.redirect(new URL("/login?e=server", req.url));
  }
}
