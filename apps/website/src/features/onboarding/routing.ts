import type { SetupDraft } from "@rawan/types/onboarding";

export function safeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\\%\s]/u.test(value)
  )
    return "/account";
  // Only existing application routes; queries cannot supply a second redirect target.
  const [path, hash] = value.split("#");
  const canonical =
    path === "/workspace"
      ? "/account"
      : path === "/workspace/reader"
        ? "/reader"
        : path;
  if (!["/account", "/studio", "/reader"].includes(canonical))
    return "/account";
  return canonical + (hash ? "#" + encodeURIComponent(hash) : "");
}

/** The purpose selects a dashboard; older starting preferences never override it. */
export function experienceDestination(
  draft: Pick<SetupDraft, "preferredStart" | "purpose">,
  returnTo: unknown = "/account",
): string {
  const target = safeReturnTo(returnTo);
  const [path, hash] = target.split("#");
  if (path !== "/account") return target;
  const destination = draft.purpose === "read" ? "/reader" : "/studio";
  return destination + (hash ? "#" + hash : "");
}
export function onboardingUrl(returnTo: unknown): string {
  return "/onboarding?returnTo=" + encodeURIComponent(safeReturnTo(returnTo));
}
export function loginUrl(returnTo: unknown): string {
  return "/login?returnTo=" + encodeURIComponent(safeReturnTo(returnTo));
}
