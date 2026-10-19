import { appConfig } from "../../../../features/auth/lib/google-auth";
import { backgroundIdFromResponse } from "../../../../features/author-desk/backgrounds";

export const runtime = "nodejs";
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { api } = appConfig();
    const response = await fetch(`${api}/studio/background`, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw Error();
    const id = backgroundIdFromResponse(await response.json());
    if (!id) throw Error();
    return Response.json(
      { backgroundId: id, refreshAfterSeconds: 300 },
      { headers },
    );
  } catch {
    return Response.json({ backgroundId: null }, { status: 503, headers });
  }
}
