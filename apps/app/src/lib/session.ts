import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiUser, AuthResponse } from "@rawan/types";
import { apiRequest } from "./api";
import { ApiError } from "./api-core";
import { sessionOptions } from "./session-options";

const options = () =>
  sessionOptions(process.env.NODE_ENV === "production", 604800);

export async function sessionToken() {
  return (await cookies()).get(options().name)?.value;
}

export async function establishSession(auth: AuthResponse) {
  if (
    typeof auth.accessToken !== "string" ||
    !auth.accessToken ||
    auth.tokenType !== "Bearer" ||
    !Number.isFinite(auth.expiresIn) ||
    auth.expiresIn <= 0 ||
    auth.accessToken.length > 3500
  )
    throw new ApiError(502);
  const cookie = sessionOptions(
    process.env.NODE_ENV === "production",
    auth.expiresIn,
  );
  (await cookies()).set(cookie.name, auth.accessToken, cookie);
}

export async function clearSession() {
  const cookie = options();
  (await cookies()).set(cookie.name, "", { ...cookie, maxAge: 0 });
}

export async function authenticatedRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {},
): Promise<T> {
  const token = await sessionToken();
  if (!token) throw new ApiError(401);
  return apiRequest<T>(path, { ...init, token });
}

// React cache deduplicates within a render only. NestJS verifies signatures, account
// existence and current permissions; mere cookie presence never grants access.
export const requireUser = cache(async (): Promise<ApiUser> => {
  try {
    return await authenticatedRequest<ApiUser>("/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/sign-in?expired=1");
    throw error;
  }
});
