import { redirect } from "next/navigation";
import type { SetupState } from "@rawan/types/onboarding";
import { hasSetupAccess } from "@rawan/types/onboarding";
import { requireSession } from "../../auth/server/session";
import { loginUrl, onboardingUrl } from "../routing";
import { parseSetupState } from "../state";
import { readAccount } from "../../auth/server/account-request";

export async function loadSetup(
  session: NonNullable<Awaited<ReturnType<typeof requireSession>>>,
  returnTo: string,
): Promise<SetupState | null> {
  const result = await readAccount(
    session.api,
    session.token,
    "/users/me/setup",
  );
  if (result.status === "expired") redirect(loginUrl(returnTo));
  if (result.status !== "ok") return null;
  try {
    return parseSetupState(result.data);
  } catch {
    return null;
  }
}
export async function requireSetup(returnTo: string) {
  const session = await requireSession(returnTo);
  if (!session) return null;
  const setup = await loadSetup(session, returnTo);
  if (setup && !hasSetupAccess(setup)) redirect(onboardingUrl(returnTo));
  return setup;
}
