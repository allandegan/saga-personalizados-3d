import { prisma } from "../../../lib/prisma";
import { getCookieName, verifySession } from "../../../lib/session";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

function getTokenFromReq(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const name = getCookieName();
  const m = cookie.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] || "";
}
async function getSession(req: Request) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}

function canRead(role: Role) {
  return role === "ADMIN" || role === "OPERADOR" || role === "CONSULTA";
}
function canCreate(role: Role) {
  return role === "ADMIN" || role === "OPERADOR";
}

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  const role = session.role as Role;
  if (!canRead(role)) return Response.json({ ok: false, error: "Sem permissão." }, { status: 403 });

  const items = await prisma.category.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ ok: true, items });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  const role = session.role as Role;
  if (!canCreate(role)) return Response.json({ ok: false, error: "Sem permissão." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return Response.json({ ok: false, error: "Informe o nome da categoria." }, { status: 400 });

  await prisma.category.create({ data: { name } });
  return Response.json({ ok: true });
}
