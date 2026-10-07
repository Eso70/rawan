import { requireSession } from "../../lib/session";
import { redirect } from "next/navigation";
import { dashboardFor, preferencesFor } from "../../lib/experience";
export const metadata = {
  title: "Workspace — Rawan",
  robots: { index: false },
};
export default async function Page() {
  const session = await requireSession();
  const preferences = await preferencesFor(session);
  if (!preferences.experience) redirect("/onboarding");
  redirect(dashboardFor(preferences.experience));
}
