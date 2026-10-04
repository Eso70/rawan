import "server-only";
import { requestJson, apiBaseUrl } from "./api-core";

export function apiRequest<T>(
  path: string,
  options: Parameters<typeof requestJson>[2] = {},
) {
  return requestJson<T>(
    apiBaseUrl(process.env.API_URL, process.env.NODE_ENV === "production"),
    path,
    options,
  );
}
