import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { getCookieName, verifySession } from "../../../lib/session";

type Role = "ADMIN" | "OPERADOR" | "CONSULTA";

async function getSession() {
  const token = cookies().get(getCookieName())?.value;
  if (!token) return null;
  const s = await verifySession(token).catch(() => null);
  return s?.sub ? s : null;
}

function canEdit(role?: Role) {
  return role === "ADMIN" || role === "OPERADOR";
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

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

    return Response.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, error: "Erro ao listar produtos.", details: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    if (!canEdit(session.role as Role)) {
      return Response.json({ ok: false, error: "Sem permissão para cadastrar." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();

    const priceRaw = body.price;
    const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);

    if (!name) return Response.json({ ok: false, error: "Informe o nome do produto." }, { status: 400 });
    if (!Number.isFinite(price)) return Response.json({ ok: false, error: "Preço inválido." }, { status: 400 });

    const categoryId = body.categoryId ? String(body.categoryId) : null;

    const created = await prisma.product.create({
      data: { name, price, categoryId: categoryId || null },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        category: { select: { id: true, name: true } }
      }
    });

    return Response.json({ ok: true, item: created }, { status: 200 });
  } catch (e: any) {
    return Response.json({ ok: false, error: "Erro ao salvar produto.", details: String(e?.message || e) }, { status: 500 });
  }
}
