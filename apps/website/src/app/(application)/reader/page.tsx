import { requireSetup } from "../../../features/onboarding/server/setup";
import { SetupUnavailable } from "../../../features/onboarding/components/setup-unavailable";

export const metadata = {
  title: "Reader Experience — Rawan",
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (!(await requireSetup("/reader")))
    return <SetupUnavailable account retry="/reader" />;
  return null;
}