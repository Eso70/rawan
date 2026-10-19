import type { Metadata } from "next";
import { OnboardingPage } from "../../../features/onboarding/onboarding-page";
import { requireSession } from "../../../features/auth/server/session";
import { loadSetup } from "../../../features/onboarding/server/setup";
import { SetupUnavailable } from "../../../features/onboarding/components/setup-unavailable";
import { hasSetupAccess } from "@rawan/types/onboarding";
import {
  safeReturnTo,
  experienceDestination,
} from "../../../features/onboarding/routing";
import { redirect } from "next/navigation";
export const metadata: Metadata = {
  title: "Welcome — Rawan",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  const session = await requireSession(returnTo);
  if (!session)
    return (
      <SetupUnavailable
        account
        retry={`/onboarding?returnTo=${encodeURIComponent(returnTo)}`}
      />
    );
  const setup = await loadSetup(session, returnTo);
  if (!setup) return <SetupUnavailable />;
  if (hasSetupAccess(setup))
    redirect(experienceDestination(setup.draft, returnTo));
  return (
    <OnboardingPage
      initialState={setup}
      existingName={session.user.name}
      returnTo={returnTo}
    />
  );
}
