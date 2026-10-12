import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  cookieOptions,
  encodeFlow,
  FLOW_COOKIE,
} from "../../../lib/google-auth";
import { isPopupId, POPUP_RESULT_COOKIE } from "../../../lib/google-popup";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("popupId");
  const popupId = isPopupId(id) ? id : undefined;
  try {
    const { client, secret, origin } = authConfig();
    if (request.nextUrl.origin !== origin)
      return NextResponse.redirect(
        `${origin}/auth/google${popupId ? `?popupId=${popupId}` : ""}`,
      );
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
        {
          state,
          nonce,
          verifier: codeVerifier,
          expires: Date.now() + 600000,
          ...(popupId ? { popupId } : {}),
        },
        secret,
      ),
      { ...cookieOptions, maxAge: 600 },
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.cookies.set(POPUP_RESULT_COOKIE, "", {
      ...cookieOptions,
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.redirect(
      "http://localhost:3000/login?error=configuration",
    );
  }
}
