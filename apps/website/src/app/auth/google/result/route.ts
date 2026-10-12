import { NextRequest, NextResponse } from "next/server";
import { authConfig, SESSION_COOKIE } from "../../../../lib/google-auth";
import {
  decodePopupResult,
  isPopupId,
  POPUP_RESULT_COOKIE,
} from "../../../../lib/google-popup";
import { loginErrors } from "../../../../lib/login-errors";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  };
  const popupId = request.nextUrl.searchParams.get("popupId");
  if (!isPopupId(popupId))
    return NextResponse.json(
      { status: "error", error: "state" },
      { status: 400, headers },
    );
  try {
    const { origin, secret } = authConfig();
    if (request.nextUrl.origin !== origin)
      return NextResponse.json(
        { status: "error", error: "configuration" },
        { status: 400, headers },
      );
    const result = decodePopupResult(
      request.cookies.get(POPUP_RESULT_COOKIE)?.value,
      secret,
      popupId,
    );
    if (!result) return NextResponse.json({ status: "pending" }, { headers });
    if (result.status === "error")
      return NextResponse.json(
        {
          status: "error",
          error: Object.hasOwn(loginErrors, result.error ?? "")
            ? result.error
            : "google",
        },
        { headers },
      );
    if (!request.cookies.get(SESSION_COOKIE)?.value)
      return NextResponse.json(
        { status: "error", error: "session" },
        { headers },
      );
    return NextResponse.json({ status: "success" }, { headers });
  } catch {
    return NextResponse.json(
      { status: "error", error: "configuration" },
      { status: 503, headers },
    );
  }
}
