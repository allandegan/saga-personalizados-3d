import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signSession } from "../../../../lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      username: user.username
    });

    // agora devolve o token no JSON
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: "Erro no login." }, { status: 500 });
  }
}
