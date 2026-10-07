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
  try {
    if (reader)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4000) {
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
    reader?.releaseLock();
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (key) =>
          !["experience", "interests", "goal", "complete", "skipped"].includes(
            key,
          ),
      )
    )
      throw new Error();
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
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return NextResponse.json(
        { message: "Could not save preferences" },
        { status: response.status },
      );
    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "Could not save preferences" },
      { status: 503 },
    );
  }
}
