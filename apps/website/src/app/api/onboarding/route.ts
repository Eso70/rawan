import { NextRequest, NextResponse } from "next/server";
import { authConfig, SESSION_COOKIE } from "../../../lib/google-auth";
export async function PATCH(request: NextRequest) {
  const { origin, api } = authConfig();
  if (request.headers.get("origin") !== origin)
    return NextResponse.json(
      { message: "Request origin rejected" },
      { status: 403 },
    );
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token)
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ message: "JSON required" }, { status: 415 });
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 12000) {
          await reader.cancel();
          return NextResponse.json(
            { message: "Request too large" },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    } catch {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    } finally {
      reader.releaseLock();
    }
  }
  const body = Buffer.concat(chunks).toString("utf8");
  try {
    JSON.parse(body);
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  try {
    const response = await fetch(`${api}/users/me/onboarding`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return NextResponse.json(
        { message: "Progress could not be saved. Please try again." },
        { status: response.status },
      );
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { message: "Progress could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
