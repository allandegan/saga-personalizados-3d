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

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.sub) return new Response("Não autenticado.", { status: 401 });

    // Export simples (redireciona para CSV)
    return Response.redirect(new URL("/api/export/csv", req.url), 302);
  } catch {
    return new Response("Erro ao exportar.", { status: 500 });
  }
}
