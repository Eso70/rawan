"use client";
import { FieldError } from "../../components/ui/controls";
import { OnboardingContinue } from "./components/onboarding-continue";
import { OnboardingBackground } from "./components/onboarding-background";
import { InterestQuestions } from "./components/interest-questions";
import {
  categoriesFromDraft,
  hasInterestChoices,
  type InterestPhase,
} from "./interest-flow";

import { useEffect, useRef, useState } from "react";
import { choosePurpose, type OnboardingDraft } from "./model";
import { normalizeName, validateDraft, validateName } from "./validation";
import {
  OnboardingFields,
  type InvalidField,
} from "./components/onboarding-fields";
import { visibleSteps as steps, type VisibleStep as Step } from "./flow";
import { useOnboardingDraft } from "./hooks/use-onboarding-draft";
import styles from "./onboarding.module.css";
import type { SetupState } from "@rawan/types/onboarding";
import { loginUrl, experienceDestination } from "./routing";
import { submissionDraft } from "./submission";
type PageProps = {
  initialState: SetupState;
  existingName?: string;
  returnTo: string;
};
export function OnboardingPage({
  initialState,
  existingName = "",
  returnTo,
}: PageProps) {
  const {
    draft,
    savedDraft,
    setDraft,
    step,
    completed,
    busy,
    expired,
    conflict,
    save,
  } = useOnboardingDraft(initialState);
  const [error, setError] = useState<string | null>(null);
  const [interestPhase, setInterestPhase] =
    useState<InterestPhase>("categories");
  const [selectedCategories, setSelectedCategories] = useState(() =>
    categoriesFromDraft(initialState.draft),
  );
  const title = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const showInvalid = (message: string, field: typeof invalidField) => {
    setInvalidField(field);
    setError(message);
  };
  useEffect(() => {
    if (error) errorMessage.current?.focus();
  }, [error]);
  const index = steps.indexOf(step);
  const update = <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step, completed, interestPhase]);
  const next = async (skip = false) => {
    if (
      step === "interests" &&
      interestPhase === "categories" &&
      !skip &&
      hasInterestChoices(draft.purpose, selectedCategories)
    ) {
      setError(null);
      setInvalidField(null);
      try {
        if (await save("interests")) setInterestPhase("choices");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Please try again.");
      }
      return;
    }
    let answers = submissionDraft(draft, savedDraft, step, skip);
    if (!skip && step === "welcome") {
      const invalid = validateName(draft.preferredName);
      if (invalid) {
        setInvalidField("name");
        setError(invalid);
        return;
      }
      answers = {
        ...answers,
        preferredName: normalizeName(draft.preferredName),
      };
    }
    if (step === "purpose" && !draft.purpose) {
      showInvalid("Choose what brings you to Rawan.", "purpose");
      return;
    }
    if (
      step === "preferences" &&
      !skip &&
      draft.discoverySource === "Other" &&
      Array.from(draft.discoveryOther.trim()).length > 120
    ) {
      showInvalid(
        "Please keep your discovery note to 120 characters or fewer.",
        "discovery",
      );
      return;
    }
    if (step === "preferences") {
      const invalid = validateDraft(draft);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    // Skipping optional questions preserves previously saved answers.
    setError(null);
    setInvalidField(null);
    try {
      const done = step === "preferences";
      if (
        (await save(done ? "begin" : steps[index + 1], answers, done)) &&
        done
      )
        window.location.replace(experienceDestination(answers, returnTo));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    }
  };
  const headings: Record<Step, string> = {
    welcome: "Welcome to Rawan.",
    purpose: "What brings you to Rawan?",
    interests:
      interestPhase === "categories"
        ? "What stories feel like you?"
        : "Which ones do you enjoy?",
    preferences: "Make yourself at home.",
  };
  return (
    <div className={styles.page}>
      <OnboardingBackground step={step} />
      <a href="#setup-main" className={styles.skipLink}>
        Skip to setup
      </a>
      <main id="setup-main" className={styles.main}>
        <div className={styles.stage}>
          <>
            <form
              aria-labelledby="setup-title"
              aria-busy={busy || completed}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void next();
              }}
            >
              <div
                className={styles.intro}
                key={`intro-${step}-${interestPhase}`}
              >
                <h1 id="setup-title" ref={title} tabIndex={-1}>
                  {headings[step]}
                </h1>
              </div>
              <fieldset
                key={`${step}-${interestPhase}`}
                disabled={busy || completed || expired || conflict}
                className={styles.fields}
                data-step={step}
                data-purpose={draft.purpose ?? undefined}
              >
                <legend className={styles.srOnly}>{headings[step]}</legend>
                {step === "interests" ? (
                  <InterestQuestions
                    draft={draft}
                    phase={interestPhase}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={setSelectedCategories}
                    update={update}
                  />
                ) : (
                  <OnboardingFields
                    step={step}
                    draft={draft}
                    existingName={existingName}
                    error={error}
                    invalidField={invalidField}
                    update={update}
                    onPurposeChange={(purpose) => {
                      setDraft((current) => choosePurpose(current, purpose));
                      setError(null);
                    }}
                  />
                )}
              </fieldset>
              {error && (
                <FieldError
                  id="setup-error"
                  className={styles.error}

                  ref={errorMessage}
                  tabIndex={-1}
                >
                  {error}
                </FieldError>
              )}
              <div className={styles.actions}>
                <div className={styles.nextActions}>
                  <OnboardingContinue
                    busy={busy || completed}
                    finish={step === "preferences"}
                    disabled={busy || completed || expired || conflict}
                  />
                </div>
              </div>
            </form>
            <p className={styles.srOnly} role="status">
              {busy ? "Saving your choices…" : ""}
            </p>
          </>
          {expired && (
            <p className={styles.caption}>
              <a href={loginUrl(returnTo)}>Sign in again to continue</a>
            </p>
          )}
          {conflict && (
            <p className={styles.caption}>
              <a href={"/onboarding?returnTo=" + encodeURIComponent(returnTo)}>
                Reload saved setup
              </a>
              . Your unsaved choices are still shown above.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
