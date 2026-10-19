import type {
  SetupDraft,
  SetupPurpose,
  SetupStart,
} from "@rawan/types/onboarding";
/** Preferences never authorize an account. Identity and completion stay server-owned. */
export type Purpose = SetupPurpose;
export type StartingExperience = SetupStart;
export type OnboardingDraft = SetupDraft;

export const purposes = [
  {
    value: "create",
    label: "Create",
    description: "I want to write books, stories, comics, or other works.",
  },
  {
    value: "read",
    label: "Read",
    description: "I want to discover and enjoy books, comics, and stories.",
  },
  {
    value: "both",
    label: "Both",
    description: "I enjoy creating and reading.",
  },
] as const;

// Both starts in the studio, with the reader experience available through its switch link.
export function startingExperience(
  purpose: Purpose | null,
): StartingExperience {
  return purpose === "read" ? "reader" : "studio";
}

export function createDraft(): OnboardingDraft {
  return {
    preferredName: "",
    purpose: null,
    creativeInterests: [],
    readingFormats: [],
    readingGenres: [],
    readingTopics: [],
    interfaceLanguage: "en",
    discoverySource: null,
    discoveryOther: "",
    preferredStart: null,
  };
}

export function choosePurpose(
  draft: OnboardingDraft,
  purpose: Purpose,
): OnboardingDraft {
  return {
    ...draft,
    purpose,
    preferredStart: startingExperience(purpose),
  };
}
export function hasCreativeInterests(purpose: Purpose | null) {
  return purpose === "create" || purpose === "both";
}
export function hasReadingInterests(purpose: Purpose | null) {
  return purpose === "read" || purpose === "both";
}
export function displayName(draft: OnboardingDraft, existingName = "") {
  return (
    draft.preferredName.trim().replace(/\s+/gu, " ") ||
    existingName.trim() ||
    "storyteller"
  );
}

// No identity, authorization role, completion timestamp or other server-owned state
// belongs in this frontend-only draft. Server contracts are a later phase.
