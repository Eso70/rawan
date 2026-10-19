"use client";
import { useRef, useState } from "react";
import type { SetupState } from "@rawan/types/onboarding";
import type { OnboardingDraft } from "../model";
import { visibleStep, type Step } from "../flow";
import { saveSetupRequest, SetupSaveError } from "../services/save-setup";
export function useOnboardingDraft(initialState: SetupState) {
  const [draft, setDraft] = useState<OnboardingDraft>(initialState.draft);
  const [step, setStep] = useState(() => visibleStep(initialState.step));
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);
  const [conflict, setConflict] = useState(false);
  const revision = useRef(initialState.revision);
  const savedDraft = useRef(initialState.draft);
  const saving = useRef(false);
  const save = async (nextStep: Step, answers = draft, complete = false) => {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    try {
      const saved = await saveSetupRequest(
        answers,
        revision.current,
        nextStep,
        complete,
      );
      savedDraft.current = saved.draft;
      revision.current = saved.revision;
      setDraft(saved.draft);
      setStep(visibleStep(saved.step));
      setCompleted(saved.status === "completed");
      return true;
    } catch (error) {
      if (error instanceof SetupSaveError) {
        if (error.status === 401) setExpired(true);
        if (error.status === 409) setConflict(true);
      }
      throw error;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return {
    draft,
    savedDraft: savedDraft.current,
    setDraft,
    step,
    completed,
    busy,
    expired,
    conflict,
    save,
  };
}
