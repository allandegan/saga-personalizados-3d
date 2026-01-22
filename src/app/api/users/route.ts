import { prisma } from "../../../lib/prisma";
import { getCookieName, verifySession } from "../../../lib/session";
import bcrypt from "bcryptjs";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

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

function normalizeUsername(u: any) {
  return String(u ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    if (session.role !== "ADMIN") return Response.json({ ok: false, error: "Somente ADMIN." }, { status: 403 });

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });

    return Response.json({ ok: true, users });
  } catch (e: any) {
    console.error("GET /api/users error:", e);
    return Response.json({ ok: false, error: "Erro ao listar usuários." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    if (session.role !== "ADMIN") return Response.json({ ok: false, error: "Somente ADMIN." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const username = normalizeUsername(body.username);
    const role = String(body.role ?? "OPERADOR").trim().toUpperCase() as Role;
    const password = String(body.password ?? "");

    if (!name || !username || !password) {
      return Response.json({ ok: false, error: "Informe nome, usuário e senha." }, { status: 400 });
    }

    if (!["ADMIN", "OPERADOR", "CONSULTA"].includes(role)) {
      return Response.json({ ok: false, error: "Role inválida." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: { name, username, role, passwordHash },
      select: { id: true, name: true, username: true, role: true, createdAt: true }
    });

    return Response.json({ ok: true, user: created });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("Unique constraint")) {
      return Response.json({ ok: false, error: "Esse usuário (login) já existe." }, { status: 400 });
    }
    console.error("POST /api/users error:", e);
    return Response.json({ ok: false, error: "Erro ao criar usuário." }, { status: 500 });
  }
}
