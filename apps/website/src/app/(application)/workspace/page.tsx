import { redirect } from "next/navigation";
export const metadata = {
  title: "Workspace — Rawan",
  robots: { index: false },
};
export default function Page() {
  redirect("/account");
}
