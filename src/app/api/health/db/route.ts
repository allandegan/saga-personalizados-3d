import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    // testa conexão e existência de tabela User
    const count = await prisma.user.count();
    return Response.json({ ok: true, users: count });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
