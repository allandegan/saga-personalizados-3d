import { prisma } from "../../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../../lib/session";

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

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const productId = String(ctx.params.id || "");

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true }
    });

    if (!product) return Response.json({ ok: false, error: "Produto não encontrado." }, { status: 404 });

    const history = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { changedAt: "desc" },
      select: { id: true, oldPrice: true, newPrice: true, note: true, changedAt: true }
    });

    return Response.json({ ok: true, product, history });
  } catch (e: any) {
    console.error("GET /api/products/[id]/history error:", e?.message || e, e);
    return Response.json({ ok: false, error: "Erro ao carregar histórico." }, { status: 500 });
  }
}
