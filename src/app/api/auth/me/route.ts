import { cookies } from "next/headers";
import { getCookieName, verifySession } from "../../../../lib/session";

export async function GET() {
  try {
    const token = cookies().get(getCookieName())?.value;

    if (!token) {
      return Response.json({ ok: true, logged: false, reason: "no_cookie" }, { status: 200 });
    }

    const session = await verifySession(token).catch(() => null);

    if (!session?.sub) {
      return Response.json({ ok: true, logged: false, reason: "invalid_token" }, { status: 200 });
    }

    return Response.json(
      {
        ok: true,
        logged: true,
        user: {
          id: session.sub,
          role: session.role,
          name: session.name,
          username: session.username
        }
      },
      { status: 200 }
    );
  } catch (e) {
    return Response.json({ ok: false, logged: false, reason: "server" }, { status: 500 });
  }
}
