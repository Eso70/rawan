import { createHmac, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const SESSION_COOKIE = "rawan_session";
export const FLOW_COOKIE = "rawan_google_flow";
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: false,
};

export function authConfig() {
  const origin = process.env.AUTH_ORIGIN;
  const api = process.env.RAWAN_API_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  // This integration is deliberately limited to the user's local environment.
  if (
    origin !== "http://localhost:3000" ||
    api !== "http://127.0.0.1:3002/api/v1" ||
    !clientId ||
    !secret
  )
    throw new Error("Local Google authentication is not configured");
  return {
    origin,
    api,
    secret,
    client: new OAuth2Client(
      clientId,
      secret,
      `${origin}/auth/google/callback`,
    ),
  };
}

type Flow = { state: string; nonce: string; verifier: string; expires: number };
export function encodeFlow(flow: Flow, secret: string) {
  const payload = Buffer.from(JSON.stringify(flow)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}
export function decodeFlow(
  value: string | undefined,
  secret: string,
): Flow | null {
  try {
    if (!value || value.length > 2048) return null;
    const [payload, signature] = value.split(".");
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const flow = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Flow;
    if (
      flow.expires < Date.now() ||
      !flow.state ||
      !flow.nonce ||
      !flow.verifier
    )
      return null;
    return flow;
  } catch {
    return null;
  }
}
