import type { Metadata } from "next";
import { LoginPage } from "../../components/login/login-page";

export const metadata: Metadata = { title: "Log in — Rawan" };

export default function Page() {
  return <LoginPage />;
}
