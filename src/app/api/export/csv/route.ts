import { prisma } from "../../../../../lib/prisma";
import { getCookieName, verifySession } from "../../../../../lib/session";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session?.sub) return new Response("Unauthorized", { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { name: true, price: true, createdAt: true }
  });

  // CSV com ; (melhor pro Excel BR)
  const header = ["Produto", "Preço", "Cadastrado em"].join(";");
  const lines = products.map((p) => {
    const price = Number(p.price).toFixed(2).replace(".", ",");
    const date = new Date(p.createdAt).toLocaleString("pt-BR");
    return [csvEscape(p.name), csvEscape(price), csvEscape(date)].join(";");
  });

  const body = [header, ...lines].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="produtos-saga.csv"`
    }
  });
}
