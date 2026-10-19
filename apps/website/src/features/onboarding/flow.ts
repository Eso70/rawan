import { SETUP_STEPS } from "@rawan/types/onboarding";
import { createDraft, type OnboardingDraft } from "./model.ts";
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
  discoverySources,
  type InterestGroup,
} from "./options.ts";
import { validateDraft, validateName } from "./validation.ts";

export const steps = SETUP_STEPS;
export type Step = (typeof steps)[number];
// Keep the persisted API step contract compatible with accounts saved on "begin".
export const visibleSteps = [
  "welcome",
  "purpose",
  "interests",
  "preferences",
] as const;
export type VisibleStep = (typeof visibleSteps)[number];
export function visibleStep(step: Step): VisibleStep {
  return step === "begin" ? "preferences" : step;
}
export type PreviewSnapshot = {
  draft: OnboardingDraft;
  step: Step;
  completed: boolean;
};
export const DRAFT_KEY = "rawan-onboarding-preview-v1";
export function freshSnapshot(): PreviewSnapshot {
  return { draft: createDraft(), step: "welcome", completed: false };
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const oneOf = <T extends string>(
  value: unknown,
  values: readonly T[],
): value is T => typeof value === "string" && values.includes(value as T);
const validSelections = (
  value: unknown,
  groups: InterestGroup[],
): value is string[] => {
  const allowed = groups.flatMap((group) =>
    group.options.map((option) => option.value),
  );
  return (
    Array.isArray(value) &&
    value.length <= allowed.length &&
    new Set(value).size === value.length &&
    value.every((item) => typeof item === "string" && allowed.includes(item))
  );
};

/** Treat browser storage as untrusted. This is a disposable UI draft, not an API DTO. */
export function decodeSnapshot(raw: string | null): PreviewSnapshot | null {
  try {
    if (!raw || raw.length > 6000) return null;
    const data: unknown = JSON.parse(raw);
    if (
      !record(data) ||
      data.version !== 1 ||
      !record(data.draft) ||
      !oneOf(data.step, steps) ||
      typeof data.completed !== "boolean"
    )
      return null;
    const d = data.draft;
    if (Object.keys(d).some((key) => !Object.hasOwn(createDraft(), key)))
      return null;
    if (
      typeof d.preferredName !== "string" ||
      d.preferredName.length > 100 ||
      /[\p{Cc}]/u.test(d.preferredName) ||
      !(
        d.purpose === null ||
        oneOf(d.purpose, ["create", "read", "both"] as const)
      ) ||
      d.interfaceLanguage !== "en" ||
      !(
        d.preferredStart === null ||
        oneOf(d.preferredStart, ["studio", "reader"] as const)
      ) ||
      !(
        d.discoverySource === null || oneOf(d.discoverySource, discoverySources)
      ) ||
      typeof d.discoveryOther !== "string" ||
      d.discoveryOther.length > 140 ||
      !validSelections(d.creativeInterests, creativeGroups) ||
      !validSelections(d.readingFormats, readingFormatGroups) ||
      !validSelections(d.readingGenres, readingGenreGroups) ||
      !validSelections(d.readingTopics, readingTopicGroups)
    )
      return null;
    const draft: OnboardingDraft = {
      preferredName: d.preferredName,
      purpose: d.purpose,
      creativeInterests: d.creativeInterests,
      readingFormats: d.readingFormats,
      readingGenres: d.readingGenres,
      readingTopics: d.readingTopics,
      interfaceLanguage: "en",
      discoverySource: d.discoverySource,
      discoveryOther: d.discoveryOther,
      preferredStart: d.preferredStart,
    };
    const step = validateName(draft.preferredName)
      ? "welcome"
      : !draft.purpose && steps.indexOf(data.step) > 1
        ? "purpose"
        : data.step;
    return {
      draft,
      step,
      completed: data.completed && validateDraft(draft) === null,
    };
  } catch {
    return null;
  }
}
export function encodeSnapshot(snapshot: PreviewSnapshot): string {
  return JSON.stringify({ version: 1, ...snapshot });
}
