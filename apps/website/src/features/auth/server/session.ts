import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig, SESSION_COOKIE } from "../lib/google-auth";
import { loginUrl } from "../../onboarding/routing";
import { readAccount, sessionUser } from "./account-request";
export async function requireSession(returnTo = "/account") {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect(loginUrl(returnTo));
  const { api } = appConfig();
  const result = await readAccount(api, token, "/users/me");
  if (result.status === "expired")
    redirect(loginUrl(returnTo) + "&error=session");
  if (result.status !== "ok") return null;
  const user = sessionUser(result.data);
  if (!user) return null;
  return { token, api, user };
}
