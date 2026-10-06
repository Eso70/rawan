import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  cookieOptions,
  encodeFlow,
  FLOW_COOKIE,
} from "../../../lib/google-auth";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const { client, secret, origin } = authConfig();
    if (request.nextUrl.origin !== origin)
      return NextResponse.redirect(`${origin}/auth/google`);
    const { codeVerifier, codeChallenge } =
      await client.generateCodeVerifierAsync();
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const url = client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      prompt: "select_account",
      code_challenge: codeChallenge,
      code_challenge_method:
        "S256" as import("google-auth-library").CodeChallengeMethod,
    });
    const response = NextResponse.redirect(url);
    response.cookies.set(
      FLOW_COOKIE,
      encodeFlow(
        { state, nonce, verifier: codeVerifier, expires: Date.now() + 600000 },
        secret,
      ),
      { ...cookieOptions, maxAge: 600 },
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(
      "http://localhost:3000/login?error=configuration",
    );
  }
}
