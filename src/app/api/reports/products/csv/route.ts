import { prisma } from "../../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../../lib/session";

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

function esc(v: any) {
  // CSV seguro com aspas
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function money(n: number) {
  return Number(n || 0).toFixed(2).replace(".", ",");
}

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return new Response("Não autenticado.", { status: 401 });

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
        price: true,
        createdAt: true,
        category: { select: { id: true, name: true } }
      }
    });

    const byCategoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; count: number; sum: number; min: number; max: number }
    >();

    for (const p of products) {
      const cid = p.category?.id || "";
      const cname = p.category?.name || "(sem categoria)";
      const key = cid || "__none__";

      const price = Number(p.price || 0);

      if (!byCategoryMap.has(key)) {
        byCategoryMap.set(key, {
          categoryId: cid,
          categoryName: cname,
          count: 0,
          sum: 0,
          min: price,
          max: price
        });
      }

      const row = byCategoryMap.get(key)!;
      row.count += 1;
      row.sum += price;
      row.min = Math.min(row.min, price);
      row.max = Math.max(row.max, price);
    }

    const rows = Array.from(byCategoryMap.values())
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

    const header = ["Categoria", "Quantidade", "Soma (R$)", "Média (R$)", "Min (R$)", "Max (R$)"];
    const lines: string[] = [];
    lines.push(header.map(esc).join(";"));

    for (const r of rows) {
      lines.push(
        [
          r.categoryName,
          r.count,
          money(r.sum),
          money(r.avg),
          money(r.min),
          money(r.max)
        ].map(esc).join(";")
      );
    }

    const csv = lines.join("\n");

    const nameParts = ["relatorio-produtos"];
    if (from) nameParts.push(`de-${from.toISOString().slice(0, 10)}`);
    if (to) nameParts.push(`ate-${to.toISOString().slice(0, 10)}`);
    if (categoryId) nameParts.push(`categoria-${categoryId}`);
    const filename = `${nameParts.join("-")}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`
      }
    });
  } catch {
    return new Response("Erro ao exportar relatório CSV.", { status: 500 });
  }
}
