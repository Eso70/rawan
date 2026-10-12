import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginPage } from "../../components/login/login-page";
import { loginErrors } from "../../lib/login-errors";

export const metadata: Metadata = { title: "Log in — Rawan" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if ((await headers()).get("host") === "127.0.0.1:3000") {
    const query = Object.hasOwn(loginErrors, params.error ?? "")
      ? `?error=${encodeURIComponent(params.error!)}`
      : "";
    redirect(`http://localhost:3000/login${query}`);
  }
  return <LoginPage error={loginErrors[params.error ?? ""] ?? ""} />;
}
