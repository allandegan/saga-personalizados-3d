import { SignJWT, jwtVerify } from "jose";

const cookieName = "saga_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(secret);
}

export function getCookieName() {
  return cookieName;
}

export async function signSession(payload: { sub: string; role: string; name: string; username: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as { sub: string; role: string; name: string; username: string; exp: number; iat: number };
}
