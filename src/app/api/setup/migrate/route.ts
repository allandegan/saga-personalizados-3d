import { execSync } from "node:child_process";

export async function POST() {
  try {
    // Roda as migrations no banco (usa DATABASE_URL do Railway)
    const out = execSync("npx prisma migrate deploy", {
      encoding: "utf8",
      stdio: "pipe"
    });

    return Response.json({ ok: true, output: out });
  } catch (e: any) {
    return Response.json(
      { ok: false, error: String(e?.message || e), output: String(e?.stdout || "") + "\n" + String(e?.stderr || "") },
      { status: 500 }
    );
  }
}
