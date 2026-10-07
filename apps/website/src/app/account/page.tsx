import { redirect } from "next/navigation";
import { requireSession } from "../../lib/session";
export const metadata = {
  title: "Your account — Rawan",
  robots: { index: false },
};
export default async function Page() {
  await requireSession();
  redirect("/workspace");
}
