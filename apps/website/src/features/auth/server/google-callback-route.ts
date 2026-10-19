import { NextRequest, NextResponse } from "next/server";
import { googleApiError } from "../lib/login-errors";
import { safeReturnTo } from "../../onboarding/routing";
import {
  authConfig,
  cookieOptions,
  decodeFlow,
  FLOW_COOKIE,
  SESSION_COOKIE,
  type Flow,
} from "../lib/google-auth";
import {
  encodePopupResult,
  POPUP_RESULT_COOKIE,
  POPUP_RESULT_LIFETIME,
} from "../lib/google-popup";

export const runtime = "nodejs";
function popupResult(
  response: NextResponse,
  flow: Flow | null,
  secret: string | undefined,
  error?: string,
) {
  if (flow?.popupId && secret)
    response.cookies.set(
      POPUP_RESULT_COOKIE,
      encodePopupResult(
        {
          popupId: flow.popupId,
          status: error ? "error" : "success",
          ...(error ? { error } : {}),
          expires: Date.now() + POPUP_RESULT_LIFETIME * 1000,
        },
        secret,
      ),
      { ...cookieOptions, maxAge: POPUP_RESULT_LIFETIME },
    );
}
function failure(error: string, flow: Flow | null = null, secret?: string) {
  const response = NextResponse.redirect(
    flow?.popupId
      ? `http://localhost:3000/auth/google/complete?popupId=${flow.popupId}`
      : `http://localhost:3000/login?${new URLSearchParams({ error, returnTo: safeReturnTo(flow?.returnTo) })}`,
  );
  popupResult(response, flow, secret, error);
  response.cookies.set(FLOW_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export async function GET(request: NextRequest) {
  let flow: Flow | null = null;
  let signingSecret: string | undefined;
  try {
    const { client, secret, api, origin } = authConfig();
    signingSecret = secret;
    flow = decodeFlow(request.cookies.get(FLOW_COOKIE)?.value, secret);
    if (!flow || flow.state !== request.nextUrl.searchParams.get("state"))
      return failure("state", flow, secret);
    if (request.nextUrl.searchParams.has("error"))
      return failure("cancelled", flow, secret);
    const code = request.nextUrl.searchParams.get("code");
    if (!code || code.length > 4096) return failure("state", flow, secret);
    const { tokens } = await client.getToken({
      code,
      codeVerifier: flow.verifier,
    });
    if (!tokens.id_token) return failure("google", flow, secret);
    const result = await fetch(`${api}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: tokens.id_token, nonce: flow.nonce }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }).catch(() => null);
    if (!result) return failure("session", flow, secret);
    if (!result.ok) return failure(googleApiError(result.status), flow, secret);
    const session = (await result.json()) as {
      accessToken: string;
      expiresIn: number;
    };
    if (
      typeof session.accessToken !== "string" ||
      !Number.isFinite(session.expiresIn)
    )
      return failure("google", flow, secret);
    const response = NextResponse.redirect(
      flow.popupId
        ? `${origin}/auth/google/complete?popupId=${flow.popupId}`
        : `${origin}${safeReturnTo(flow.returnTo)}`,
    );
    response.cookies.set(FLOW_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set(SESSION_COOKIE, session.accessToken, {
      ...cookieOptions,
      maxAge: session.expiresIn,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    popupResult(response, flow, secret);
    return response;
  } catch {
    return failure("google", flow, signingSecret);
  }
}
