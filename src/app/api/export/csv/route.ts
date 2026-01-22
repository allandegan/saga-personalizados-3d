import { prisma } from "@/lib/prisma";
import { getCookieName, verifySession } from "@/lib/session";

function tokenFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const name = getCookieName();
  const m = cookie.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] || "";
}

async function getSession(req: Request) {
  const token = tokenFromCookie(req);
  if (!token) return null;
  return await verifySession(token).catch(() => null);
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return new Response("Não autenticado.", { status: 401 });

    const items = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        createdAt: true,
        category: { select: { name: true } }
      }
    });

    const header = ["ID", "Produto", "Categoria", "Preço", "Criado em"];
    const lines = [
      header.join(","),
      ...items.map((p) =>
        [
          csvEscape(p.id),
          csvEscape(p.name),
          csvEscape(p.category?.name || ""),
          csvEscape(Number(p.price).toFixed(2).replace(".", ",")),
          csvEscape(new Date(p.createdAt).toLocaleString("pt-BR"))
        ].join(",")
      )
    ];

    const body = lines.join("\n");

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="produtos.csv"`
      }
    });
  } catch {
    return new Response("Erro ao exportar CSV.", { status: 500 });
  }
}
