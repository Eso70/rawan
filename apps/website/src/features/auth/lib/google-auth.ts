import { createHmac, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { isPopupId } from "./google-popup.ts";
import { safeReturnTo } from "../../onboarding/routing.ts";

export const SESSION_COOKIE = "rawan_session";
export const FLOW_COOKIE = "rawan_google_flow";
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: false,
};

export function appConfig() {
  const origin = process.env.AUTH_ORIGIN;
  const api = process.env.RAWAN_API_URL;
  if (
    origin !== "http://localhost:3000" ||
    api !== "http://127.0.0.1:3002/api/v1"
  )
    throw new Error("Local authentication is not configured");
  return { origin, api };
}
export function authConfig() {
  const { origin, api } = appConfig();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  // This integration is deliberately limited to the user's local environment.
  if (!clientId || !secret)
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

export type Flow = {
  state: string;
  nonce: string;
  verifier: string;
  expires: number;
  popupId?: string;
  returnTo?: string;
};
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
    const parts = value.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const flow = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Flow;
    if (
      !Number.isFinite(flow.expires) ||
      flow.expires <= Date.now() ||
      !flow.state ||
      !flow.nonce ||
      !flow.verifier
    )
      return null;
    if (flow.popupId !== undefined && !isPopupId(flow.popupId)) return null;
    if (
      flow.returnTo !== undefined &&
      (typeof flow.returnTo !== "string" ||
        safeReturnTo(flow.returnTo) !== flow.returnTo)
    )
      return null;
    return flow;
  } catch {
    return null;
  }
}
