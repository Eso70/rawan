/** Read-only account checks. Never reuse retries for login, email or setup writes. */
export type AccountResult =
  | { status: "ok"; data: unknown }
  | { status: "expired" }
  | { status: "unavailable" };

export async function readAccount(
  api: string,
  token: string,
  path: "/users/me" | "/users/me/setup",
  fetcher: typeof fetch = fetch,
  pause: () => Promise<void> = () =>
    new Promise((resolve) => setTimeout(resolve, 250)),
): Promise<AccountResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher(`${api}${path}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      if (response.status === 401) return { status: "expired" };
      if (response.ok) {
        // Parsing remains inside the request timeout / failure boundary.
        const data: unknown = await response.json();
        return { status: "ok", data };
      }
      const temporary = [500, 502, 503, 504].includes(response.status);
      // Release an unread response before retrying; never echo upstream content or tokens.
      await response.body?.cancel();
      if (!temporary) return { status: "unavailable" };
    } catch {
      // Connection refusal/reset, timeout and malformed upstream responses fail closed.
    }
    if (attempt === 0) await pause();
  }
  return { status: "unavailable" };
}

export type SessionUser = { id: string; name: string; email: string };
export function sessionUser(value: unknown): SessionUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as Record<string, unknown>;
  if (
    typeof user.id !== "string" ||
    !user.id ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    !user.email
  )
    return null;
  return { id: user.id, name: user.name, email: user.email };
}
