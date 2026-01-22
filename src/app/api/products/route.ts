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
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const role = session.role as Role;
    if (!canRead(role)) return Response.json({ ok: false, error: "Sem permissão." }, { status: 403 });

    const items = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        category: { select: { id: true, name: true } }
      }
    });

    return Response.json({ ok: true, items });
  } catch {
    return Response.json({ ok: false, error: "Erro ao listar produtos." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const role = session.role as Role;
    if (!canCreate(role)) return Response.json({ ok: false, error: "Sem permissão." }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();

    // aceita unitPrice number (do front já vem numérico)
    const priceNum = Number(body.unitPrice);

    const categoryId = body.categoryId ? String(body.categoryId) : null;

    if (!name) return Response.json({ ok: false, error: "Informe o nome do produto." }, { status: 400 });
    if (!Number.isFinite(priceNum)) return Response.json({ ok: false, error: "Preço inválido." }, { status: 400 });

    const created = await prisma.product.create({
      data: { name, price: priceNum, categoryId: categoryId || null },
      select: { id: true }
    });

    return Response.json({ ok: true, id: created.id });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Erro ao cadastrar produto." }, { status: 500 });
  }
}
