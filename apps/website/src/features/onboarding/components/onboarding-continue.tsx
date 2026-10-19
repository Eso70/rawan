import { Button } from "../../../components/ui/controls";
import styles from "./onboarding-action.module.css";

export function OnboardingContinue({
  busy,
  disabled,
  finish,
}: {
  busy: boolean;
  disabled: boolean;
  finish: boolean;
}) {
  return (
    <Button
      className={styles.button}
      type="submit"
      loading={busy}
      disabled={disabled}
    >
      {busy ? "Saving…" : finish ? "Finish setup" : "Continue"}
    </Button>
  );
}
