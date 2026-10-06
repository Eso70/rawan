import type { Metadata } from "next";
import { LoginPage } from "../../components/login/login-page";

export const metadata: Metadata = { title: "Log in — Rawan" };

const errors: Record<string, string> = {
  configuration: "Google sign-in is not configured. Please contact support.",
  state: "This sign-in request expired. Please try again.",
  cancelled: "Google sign-in was cancelled. You can try again.",
  linking:
    "An account already uses this email. Contact support to link it safely.",
  limit: "Too many sign-in attempts. Please wait a minute and try again.",
  google:
    "Google sign-in could not finish. Please try again or contact support.",
  session:
    "Your session expired or the server is unavailable. Please sign in again.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <LoginPage error={errors[params.error ?? ""] ?? ""} />;
}
