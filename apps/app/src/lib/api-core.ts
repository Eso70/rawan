export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super("The API request could not be completed.");
    this.status = status;
    this.name = "ApiError";
  }
}

export function apiBaseUrl(
  value: string | undefined,
  production = false,
): string {
  if (!value && production) throw new ApiError(503);
  try {
    const url = new URL(value || "http://localhost:3002/api/v1");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (production &&
        url.protocol !== "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    ) {
      throw new Error("Invalid API URL");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new ApiError(503);
  }
}

export async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: {
    token?: string;
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
  } = {},
  fetcher: typeof fetch = fetch,
): Promise<T> {
  if (!/^\/[a-zA-Z0-9_/-]+$/.test(path) || path.startsWith("//"))
    throw new ApiError(400);
  let response: Response;
  try {
    response = await fetcher(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new ApiError(503);
  }
  if (!response.ok) throw new ApiError(response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(502);
  }
}

export function errorMessage(error: unknown, auth = false): string {
  if (!(error instanceof ApiError))
    return "Something went wrong. Please try again.";
  switch (error.status) {
    case 400:
      return "Check your entries and try again.";
    case 401:
      return auth
        ? "The email or password is incorrect."
        : "Your session has expired. Please sign in again.";
    case 403:
      return "Your account cannot perform this action. An author profile may be required.";
    case 404:
      return "This resource is unavailable or you no longer have access to it.";
    case 409:
      return "An account with this email already exists. Please sign in.";
    case 413:
      return "This content is too large to save. Please shorten it.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Rawan cannot reach the writing service right now. Please try again shortly.";
  }
}
