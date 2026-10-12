import { NextRequest, NextResponse } from "next/server";
import {
  appConfig,
  cookieOptions,
  SESSION_COOKIE,
} from "../../../lib/google-auth";

export const runtime = "nodejs";
const actions: Record<string, { path: string; keys: string[] }> = {
  signup: { path: "/auth/email/signup", keys: ["email", "password"] },
  login: { path: "/auth/login", keys: ["email", "password"] },
  verify: { path: "/auth/email/verify", keys: ["verificationId", "code"] },
  resend: { path: "/auth/email/resend", keys: ["verificationId"] },
};
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { origin, api } = appConfig();
    if (request.headers.get("origin") !== origin)
      return NextResponse.json(
        { message: "Request origin rejected" },
        { status: 403, headers },
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return NextResponse.json(
        { message: "JSON required" },
        { status: 415, headers },
      );
    const reader = request.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      if (reader)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 4096) {
            await reader.cancel();
            return NextResponse.json(
              { message: "Request too large" },
              { status: 413, headers },
            );
          }
          chunks.push(value);
        }
    } finally {
      reader?.releaseLock();
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        typeof body.action !== "string" ||
        !Object.hasOwn(actions, body.action)
      )
        throw Error();
      const selected = actions[body.action];
      if (
        Object.keys(body).some(
          (key) => key !== "action" && !selected.keys.includes(key),
        ) ||
        selected.keys.some((key) => typeof body[key] !== "string")
      )
        throw Error();
    } catch {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400, headers },
      );
    }
    const action = body.action as string;
    const selected = actions[action];
    const result = await fetch(`${api}${selected.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.fromEntries(selected.keys.map((key) => [key, body[key]])),
      ),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
    const data = await result.json();
    if (!result.ok)
      return NextResponse.json(
        {
          message:
            typeof data.message === "string"
              ? data.message
              : Array.isArray(data.message)
                ? data.message.join(" ")
                : "Sign-in could not finish. Please try again.",
        },
        { status: result.status, headers },
      );
    if (action === "signup" || action === "resend")
      return NextResponse.json(
        {
          verificationId: data.verificationId,
          expiresIn: data.expiresIn,
          resendAfter: data.resendAfter,
        },
        { status: 202, headers },
      );
    if (
      typeof data.accessToken !== "string" ||
      !data.accessToken ||
      !Number.isFinite(data.expiresIn) ||
      data.expiresIn <= 0
    )
      throw Error();
    const response = NextResponse.json({ signedIn: true }, { headers });
    response.cookies.set(SESSION_COOKIE, data.accessToken, {
      ...cookieOptions,
      maxAge: data.expiresIn,
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        message: "Sign-in is temporarily unavailable. Please try again later.",
      },
      { status: 503, headers },
    );
  }
}
