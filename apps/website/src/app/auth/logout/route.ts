import { NextRequest, NextResponse } from "next/server";
import {
  authConfig,
  cookieOptions,
  SESSION_COOKIE,
  FLOW_COOKIE,
} from "../../../lib/google-auth";

export async function POST(request: NextRequest) {
  const { origin } = authConfig();
  if (request.headers.get("origin") !== origin)
    return new NextResponse(null, { status: 403 });
  const response = NextResponse.redirect(`${origin}/login`, 303);
  for (const name of [SESSION_COOKIE, FLOW_COOKIE])
    response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
