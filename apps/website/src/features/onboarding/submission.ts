import type { SetupDraft, SetupStep } from "@rawan/types/onboarding";
import { normalizeName } from "./validation.ts";
import { startingExperience } from "./model.ts";

/** Skip ignores unsaved answers on that optional step, preserving the account's saved choices. */
export function submissionDraft(
  draft: SetupDraft,
  saved: SetupDraft,
  step: SetupStep,
  skip: boolean,
): SetupDraft {
  const answers = {
    ...draft,
    preferredName: normalizeName(draft.preferredName),
    preferredStart: startingExperience(draft.purpose),
  };
  if (!skip) return answers;
  if (step === "welcome") answers.preferredName = saved.preferredName;
  if (step === "interests") {
    answers.creativeInterests = saved.creativeInterests;
    answers.readingFormats = saved.readingFormats;
    answers.readingGenres = saved.readingGenres;
    answers.readingTopics = saved.readingTopics;
  }
  if (step === "preferences") {
    answers.discoverySource = saved.discoverySource;
    answers.discoveryOther = saved.discoveryOther;
  }
  return answers;
}
