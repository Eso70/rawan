import type { OnboardingDraft } from "./model.ts";

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}
export function validateName(value: string): string | null {
  if (/[\p{Cc}\p{Cf}]/u.test(value.replace(/[\t\n\r]/g, " ")))
    return "Please remove invisible or control characters from your name.";
  return Array.from(normalizeName(value)).length > 80
    ? "Please use 80 characters or fewer."
    : null;
}
export function validateDraft(draft: OnboardingDraft): string | null {
  const nameError = validateName(draft.preferredName);
  if (nameError) return nameError;
  if (!["create", "read", "both"].includes(draft.purpose ?? ""))
    return "Choose what brings you to Rawan.";
  if (
    draft.discoverySource === "Other" &&
    Array.from(draft.discoveryOther.trim()).length > 120
  )
    return "Please keep your discovery note to 120 characters or fewer.";
  return null;
}
