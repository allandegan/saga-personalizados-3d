import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!name || !username || !password) {
      return Response.json({ error: "Informe name, username e password." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { username },
      update: { name, passwordHash, role: "ADMIN" },
      create: { name, username, passwordHash, role: "ADMIN" }
    });

    return Response.json({ ok: true, user: { username: user.username, role: user.role } });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
