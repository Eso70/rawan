import { redirect } from "next/navigation";
import { requireSetup } from "../../../features/onboarding/server/setup";
import { experienceDestination } from "../../../features/onboarding/routing";
import { SetupUnavailable } from "../../../features/onboarding/components/setup-unavailable";
export const metadata = {
  title: "Your account — Rawan",
  robots: { index: false },
};
export default async function Page() {
  const setup = await requireSetup("/account");
  if (!setup) return <SetupUnavailable account retry="/account" />;
  redirect(experienceDestination(setup.draft));
}
