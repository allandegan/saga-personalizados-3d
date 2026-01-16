import { verifySession } from "../../../../lib/session";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token) {
    return Response.json({ ok: false, logged: false, reason: "no_token" }, { status: 200 });
  }

  try {
    const payload = await verifySession(token);
    return Response.json({ ok: true, logged: true, user: payload }, { status: 200 });
  } catch (e: any) {
    return Response.json(
      { ok: false, logged: false, reason: "invalid_token", error: String(e?.message || e) },
      { status: 200 }
    );
  }
}
