import { prisma } from "../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../lib/session";
import bcrypt from "bcryptjs";

async function getSession(req: Request) {
  const cookieName = getCookieName();
  const cookieHeader = req.headers.get("cookie") || "";
  const token =
    cookieHeader
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(cookieName + "="))
      ?.split("=")
      .slice(1)
      .join("=") || "";

  if (!token) return null;
  return await verifySession(token);
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    if (session.role !== "ADMIN") return Response.json({ ok: false, error: "Somente ADMIN." }, { status: 403 });

    const id = String(ctx.params.id || "");
    const body = await req.json().catch(() => ({}));

    // Reset de senha (por enquanto só isso)
    const password = String(body.password ?? "");
    if (!password) return Response.json({ ok: false, error: "Informe a nova senha." }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });

    return Response.json({ ok: true, user: updated });
  } catch (e: any) {
    console.error("PATCH /api/users/[id] error:", e);
    return Response.json({ ok: false, error: "Erro ao resetar senha." }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    if (session.role !== "ADMIN") return Response.json({ ok: false, error: "Somente ADMIN." }, { status: 403 });

    const id = String(ctx.params.id || "");

    // não permitir excluir o último ADMIN
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return Response.json({ ok: false, error: "Usuário não encontrado." }, { status: 404 });

    if (target.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return Response.json({ ok: false, error: "Não é permitido excluir o último ADMIN." }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/users/[id] error:", e);
    return Response.json({ ok: false, error: "Erro ao excluir usuário." }, { status: 500 });
  }
}
