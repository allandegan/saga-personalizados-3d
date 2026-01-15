import { cookies } from "next/headers";
import { getCookieName, verifySession } from "../../../../lib/session";

export async function GET() {
  const token = cookies().get(getCookieName())?.value;

  if (!token) {
    return Response.json({ ok: false, logged: false, reason: "no_cookie" }, { status: 200 });
  }

  try {
    const payload = await verifySession(token);
    return Response.json({ ok: true, logged: true, user: payload }, { status: 200 });
  } catch (e: any) {
    return Response.json(
      { ok: false, logged: false, reason: "invalid_cookie", error: String(e?.message || e) },
      { status: 200 }
    );
  }
}
