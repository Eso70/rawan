import { redirect } from "next/navigation";
import { requireSession } from "../../lib/session";
import { dashboardFor, preferencesFor } from "../../lib/experience";
import { PreferencesForm } from "../../components/preferences/preferences-form";
export const metadata = { title: "Welcome — Rawan", robots: { index: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await requireSession();
  const preferences = await preferencesFor(session);
  if (preferences.experience && (await searchParams).edit !== "1")
    redirect(dashboardFor(preferences.experience));
  return <PreferencesForm initial={preferences} />;
}
