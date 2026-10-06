import { redirect } from "next/navigation";
import { requireSession, onboardingFor } from "../../lib/session";
import { TutorialWorkspace } from "../../components/onboarding/tutorial-workspace";
export const metadata = {
  title: "Tutorial world — Rawan",
  robots: { index: false },
};
export default async function Page() {
  const session = await requireSession();
  const state = await onboardingFor(session);
  if (!state.completedAt) redirect("/onboarding");
  return <TutorialWorkspace name={session.user.name} state={state} />;
}
