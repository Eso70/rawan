import { TextInput, Radio } from "../../../components/ui/controls";
import { LanguageDropdown } from "../../../components/ui/language-dropdown";
import { IconBook2, IconFeather, IconBooks } from "@tabler/icons-react";
import type { OnboardingDraft, Purpose } from "../model";
import { purposes } from "../model";
import type { Step } from "../flow";

import styles from "../onboarding.module.css";
export type InvalidField = "name" | "purpose" | "discovery" | null;
export type OnboardingFieldsProps = {
  step: Step;
  draft: OnboardingDraft;
  existingName: string;
  error: string | null;
  invalidField: InvalidField;
  update: <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K],
  ) => void;
  onPurposeChange: (purpose: Purpose) => void;
};
export function OnboardingFields({
  step,
  draft,
  existingName,
  error,
  invalidField,
  update,
  onPurposeChange,
}: OnboardingFieldsProps) {
  return (
    <>
      {step === "welcome" && (
        <>
          <label className={styles.label} htmlFor="preferred-name">
            What should we call you? <span>Optional</span>
          </label>
          <TextInput
            className={styles.input}
            id="preferred-name"
            autoComplete="nickname"
            placeholder={existingName || "Your preferred name"}
            value={draft.preferredName}
            maxLength={160}
            aria-describedby={
              error && invalidField === "name" ? "setup-error" : undefined
            }
            aria-invalid={(!!error && invalidField === "name") || undefined}
            onChange={(event) => update("preferredName", event.target.value)}
          />
        </>
      )}
      {step === "purpose" && (
        <fieldset
          aria-describedby={
            error && invalidField === "purpose" ? "setup-error" : undefined
          }
        >
          <legend className={styles.srOnly}>
            What would you like to do on Rawan?
          </legend>
          <div className={styles.choices}>
            {purposes.map((item) => (
              <label key={item.value} className={styles.choice}>
                <Radio
                  name="purpose"
                  required
                  value={item.value}
                  checked={draft.purpose === item.value}
                  onChange={() => {
                    onPurposeChange(item.value);
                  }}
                />
                {item.value === "create" ? (
                  <IconFeather size={20} stroke={1.5} aria-hidden="true" />
                ) : item.value === "read" ? (
                  <IconBook2 size={20} stroke={1.5} aria-hidden="true" />
                ) : (
                  <IconBooks size={20} stroke={1.5} aria-hidden="true" />
                )}
                <span>
                  <strong>{item.label}</strong>
                  <span className={styles.choiceDescription}>
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {step === "preferences" && (
        <>
          <div id="interface-language-label" className={styles.label}>
            Which language would you like to use?
          </div>
          <LanguageDropdown
            id="interface-language"
            variant="field"
            labelledBy="interface-language-label"
          />
        </>
      )}
    </>
  );
}
