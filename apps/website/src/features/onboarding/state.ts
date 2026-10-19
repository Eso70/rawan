import { SETUP_STEPS, type SetupState } from "@rawan/types/onboarding";
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const date = (value: unknown) =>
  value === null ||
  (typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value)));
/** Reject an incompatible/upstream error payload before it can become a page or access decision. */
export function parseSetupState(value: unknown): SetupState | null {
  if (!record(value) || !record(value.draft)) return null;
  const d = value.draft;
  if (
    value.version !== 1 ||
    typeof value.status !== "string" ||
    !["not_started", "in_progress", "completed"].includes(value.status) ||
    typeof value.required !== "boolean" ||
    !Number.isInteger(value.revision) ||
    Number(value.revision) < 0 ||
    !SETUP_STEPS.includes(value.step as SetupState["step"])
  )
    return null;
  if (
    typeof d.preferredName !== "string" ||
    Array.from(d.preferredName).length > 80 ||
    ![null, "create", "read", "both"].includes(d.purpose as null | string) ||
    ![null, "studio", "reader"].includes(d.preferredStart as null | string) ||
    d.interfaceLanguage !== "en" ||
    !(d.discoverySource === null || typeof d.discoverySource === "string") ||
    typeof d.discoveryOther !== "string" ||
    Array.from(d.discoveryOther).length > 120
  )
    return null;
  for (const key of [
    "creativeInterests",
    "readingFormats",
    "readingGenres",
    "readingTopics",
  ]) {
    const entries = d[key];
    if (
      !Array.isArray(entries) ||
      entries.length > 33 ||
      !entries.every((entry) => typeof entry === "string") ||
      new Set(entries).size !== entries.length
    )
      return null;
  }
  if (!date(value.completedAt)) return null;
  if (
    value.status === "completed" &&
    (!value.completedAt || (value.required && !d.purpose))
  )
    return null;
  return value as unknown as SetupState;
}
