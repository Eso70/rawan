import { NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  cookieOptions,
  decodeFlow,
  FLOW_COOKIE,
  SESSION_COOKIE,
} from "../../../../lib/google-auth";

export const runtime = "nodejs";
function failure(error: string) {
  const response = NextResponse.redirect(
    `http://localhost:3000/login?error=${error}`,
  );
  response.cookies.set(FLOW_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
export async function GET(request: NextRequest) {
  try {
    const { client, secret, api, origin } = authConfig();
    const flow = decodeFlow(request.cookies.get(FLOW_COOKIE)?.value, secret);
    if (!flow || flow.state !== request.nextUrl.searchParams.get("state"))
      return failure("state");
    if (request.nextUrl.searchParams.has("error")) return failure("cancelled");
    const code = request.nextUrl.searchParams.get("code");
    if (!code || code.length > 4096) return failure("state");
    const { tokens } = await client.getToken({
      code,
      codeVerifier: flow.verifier,
    });
    if (!tokens.id_token) return failure("google");
    const result = await fetch(`${api}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: tokens.id_token, nonce: flow.nonce }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok)
      return failure(
        result.status === 409
          ? "linking"
          : result.status === 429
            ? "limit"
            : "google",
      );
    const session = (await result.json()) as {
      accessToken: string;
      expiresIn: number;
    };
    if (
      typeof session.accessToken !== "string" ||
      !Number.isFinite(session.expiresIn)
    )
      return failure("google");
    const response = NextResponse.redirect(`${origin}/account`);
    response.cookies.set(FLOW_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set(SESSION_COOKIE, session.accessToken, {
      ...cookieOptions,
      maxAge: session.expiresIn,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return failure("google");
  }
}
