import { prisma } from "../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../lib/session";

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

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return new Response("Não autenticado.", { status: 401 });

    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId"); // opcional

    const where = categoryId ? { categoryId } : {};

    const items = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        price: true,
        createdAt: true,
        category: { select: { name: true } }
      }
    });

    // CSV com separador ; (padrão BR/Excel)
    const header = ["Produto", "Categoria", "Preço", "Criado em"].join(";");
    const lines = items.map((p) => {
      const price = Number(p.price || 0).toFixed(2).replace(".", ",");
      const created = p.createdAt ? new Date(p.createdAt).toLocaleString("pt-BR") : "";
      return [
        csvEscape(p.name),
        csvEscape(p.category?.name || "Sem categoria"),
        csvEscape(price),
        csvEscape(created)
      ].join(";");
    });

    const csv = [header, ...lines].join("\n");

    const filename = categoryId ? `produtos_categoria_${categoryId}.csv` : "produtos.csv";

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (e: any) {
    console.error("GET /api/products/export error:", e);
    return new Response("Erro ao exportar CSV.", { status: 500 });
  }
}
