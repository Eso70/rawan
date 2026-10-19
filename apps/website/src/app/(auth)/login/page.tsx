import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginPage } from "../../../features/auth/components/login-page";
import { loginErrors } from "../../../features/auth/lib/login-errors";
import { safeReturnTo } from "../../../features/onboarding/routing";

export const metadata: Metadata = { title: "Log in — Rawan" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  if ((await headers()).get("host") === "127.0.0.1:3000") {
    const query = new URLSearchParams({
      returnTo: safeReturnTo(params.returnTo),
    });
    if (Object.hasOwn(loginErrors, params.error ?? ""))
      query.set("error", params.error!);
    redirect(`http://localhost:3000/login?${query}`);
  }
  return <LoginPage error={loginErrors[params.error ?? ""] ?? ""} />;
}
