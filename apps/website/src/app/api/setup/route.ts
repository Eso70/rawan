import { NextRequest, NextResponse } from "next/server";
import {
  appConfig,
  SESSION_COOKIE,
} from "../../../features/auth/lib/google-auth";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function PATCH(request: NextRequest) {
  const reply = (message: string, status: number) =>
    NextResponse.json({ message }, { status, headers });
  try {
    const { origin, api } = appConfig();
    if (request.headers.get("origin") !== origin)
      return reply("Request origin rejected", 403);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token)
      return reply("Your session has expired. Sign in again to continue.", 401);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return reply("JSON required", 415);
    const reader = request.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    try {
      if (reader)
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8192) {
            await reader.cancel();
            return reply("Request too large", 413);
          }
          chunks.push(value);
        }
    } finally {
      reader?.releaseLock();
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return reply("Invalid request", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return reply("Invalid request", 400);
    const result = await fetch(`${api}/users/me/setup`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (result.status === 401)
      return reply("Your session has expired. Sign in again to continue.", 401);
    const data = await result.json();
    if (!result.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(" ")
        : data.message;
      return reply(
        result.status >= 500
          ? "Your choices couldn’t be saved. Please try again."
          : typeof message === "string"
            ? message
            : "Your choices couldn’t be saved. Please try again.",
        result.status,
      );
    }
    return NextResponse.json(data, { headers });
  } catch {
    return reply("Your choices couldn’t be saved. Please try again.", 503);
  }
}
