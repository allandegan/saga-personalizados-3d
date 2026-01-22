import { prisma } from "../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../lib/session";

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

function canEditNonPrice(role: Role) {
  return role === "ADMIN" || role === "OPERADOR";
}
function canEditPrice(role: Role) {
  return role === "ADMIN";
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const role = session.role as Role;

    const id = String(ctx.params.id || "");
    const body = await req.json().catch(() => ({}));

    const hasPriceChange = body.unitPrice !== undefined || body.price !== undefined;

    // OPERADOR não pode editar preço (Regra B)
    if (hasPriceChange) {
      if (!canEditPrice(role)) return Response.json({ ok: false, error: "Somente ADMIN pode alterar preço." }, { status: 403 });
    } else {
      if (!canEditNonPrice(role)) return Response.json({ ok: false, error: "Sem permissão." }, { status: 403 });
    }

    const data: any = {};

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return Response.json({ ok: false, error: "Nome inválido." }, { status: 400 });
      data.name = name;
    }

    if (body.categoryId !== undefined) {
      const categoryId = body.categoryId ? String(body.categoryId) : null;
      data.categoryId = categoryId || null;
    }

    if (hasPriceChange) {
      const priceNum = Number(body.unitPrice ?? body.price);
      if (!Number.isFinite(priceNum)) return Response.json({ ok: false, error: "Preço inválido." }, { status: 400 });

      const prod = await prisma.product.findUnique({ where: { id }, select: { price: true } });
      if (!prod) return Response.json({ ok: false, error: "Produto não encontrado." }, { status: 404 });

      data.price = priceNum;

      // histórico
      await prisma.priceHistory.create({
        data: {
          productId: id,
          oldPrice: prod.price,
          newPrice: priceNum,
          note: body.note ? String(body.note) : null
        }
      });
    }

    await prisma.product.update({ where: { id }, data });

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Erro ao atualizar produto." }, { status: 500 });
  }
}
