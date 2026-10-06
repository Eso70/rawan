import { requireSession, onboardingFor } from "../../lib/session";
import { Onboarding } from "../../components/onboarding/onboarding";
export const metadata = { title: "Welcome to Rawan", robots: { index: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ replay?: string }>;
}) {
  const session = await requireSession();
  const state = await onboardingFor(session);
  const replay = (await searchParams).replay === "1";
  return (
    <Onboarding
      initial={replay ? { ...state, phase: "choice", step: 0 } : state}
    />
  );
}
