import { prisma } from "../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../lib/session";

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

function parseDate(s: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return Response.json({ ok: false, error: "Não autenticado." }, { status: 401 });

    const url = new URL(req.url);
    const from = parseDate(url.searchParams.get("from"));
    const to = parseDate(url.searchParams.get("to"));
    const categoryId = (url.searchParams.get("categoryId") || "").trim();

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        category: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalCount = products.length;
    const sum = products.reduce((acc, p) => acc + Number(p.price || 0), 0);
    const avg = totalCount ? sum / totalCount : 0;

    const byCategoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; count: number; sum: number; min: number; max: number }
    >();

    for (const p of products) {
      const cid = p.category?.id || "";
      const cname = p.category?.name || "(sem categoria)";
      const key = cid || "__none__";

      if (!byCategoryMap.has(key)) {
        byCategoryMap.set(key, {
          categoryId: cid,
          categoryName: cname,
          count: 0,
          sum: 0,
          min: Number(p.price || 0),
          max: Number(p.price || 0)
        });
      }

      const row = byCategoryMap.get(key)!;
      row.count += 1;

      const price = Number(p.price || 0);
      row.sum += price;
      row.min = Math.min(row.min, price);
      row.max = Math.max(row.max, price);
    }

    const byCategory = Array.from(byCategoryMap.values())
      .map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        count: r.count,
        sum: r.sum,
        avg: r.count ? r.sum / r.count : 0,
        min: r.min,
        max: r.max
      }))
      .sort((a, b) => b.sum - a.sum);

    return Response.json({
      ok: true,
      filters: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
        categoryId: categoryId || null
      },
      totals: { totalCount, sum, avg },
      byCategory
    });
  } catch {
    return Response.json({ ok: false, error: "Erro ao gerar relatório." }, { status: 500 });
  }
}
