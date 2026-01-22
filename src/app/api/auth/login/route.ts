import { prisma } from "@/lib/prisma";
import { signSession, getCookieName } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return Response.json({ ok: false, error: "Informe usuário e senha." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return Response.json({ ok: false, error: "Usuário ou senha inválidos." }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return Response.json({ ok: false, error: "Usuário ou senha inválidos." }, { status: 401 });

    const token = await signSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      username: user.username
    });

    const cookie = `${getCookieName()}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "set-cookie": cookie }
    });
  } catch (e) {
    return Response.json({ ok: false, error: "Erro no login." }, { status: 500 });
  }
}
