import { getCookieName, verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function getTokenFromReq(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const name = getCookieName();
  const m = cookie.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] || "";
}

export async function GET(req: Request) {
  try {
    const token = getTokenFromReq(req);

    if (!token) {
      return Response.json({ ok: true, logged: false, reason: "no_token" }, { status: 200 });
    }

    const session = await verifySession(token).catch(() => null);

    if (!session?.sub) {
      return Response.json({ ok: true, logged: false, reason: "invalid_token" }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(session.sub) },
      select: { id: true, name: true, username: true, role: true }
    });

    if (!user) {
      return Response.json({ ok: true, logged: false, reason: "no_user" }, { status: 200 });
    }

    return Response.json({ ok: true, logged: true, user }, { status: 200 });
  } catch {
    return Response.json({ ok: false, error: "Erro ao verificar sessão." }, { status: 500 });
  }
}
