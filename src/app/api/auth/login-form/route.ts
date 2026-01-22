import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { signSession, getCookieName } from "../../../../lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "Informe usuário e senha." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ ok: false, error: "Usuário ou senha inválidos." }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ ok: false, error: "Usuário ou senha inválidos." }, { status: 401 });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      username: user.username
    });

    const cookieName = getCookieName();

    const res = NextResponse.json(
      { ok: true, cookieName },
      { status: 200 }
    );

    // ✅ Forma mais compatível possível (Railway + Chrome)
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Erro no login." }, { status: 500 });
  }
}
