import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig, SESSION_COOKIE } from "./google-auth";
import type { OnboardingState } from "./onboarding";
export async function requireSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  const { api } = authConfig();
  let response: Response;
  try {
    response = await fetch(`${api}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    redirect("/login?error=session");
  }
  if (!response.ok) redirect("/login?error=session");
  const user = (await response.json()) as {
    id: string;
    name: string;
    email: string;
  };
  return { token, api, user };
}
export async function onboardingFor(session: {
  token: string;
  api: string;
}): Promise<OnboardingState> {
  let response: Response;
  try {
    response = await fetch(`${session.api}/users/me/onboarding`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    redirect("/login?error=session");
  }
  if (!response.ok) redirect("/login?error=session");
  return response.json();
}
