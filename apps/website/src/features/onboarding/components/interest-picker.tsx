import { IconBook2, IconCheck } from "@tabler/icons-react";
import { Checkbox } from "../../../components/ui/controls";
import styles from "../onboarding.module.css";

export function InterestPicker({
  options,
  selected,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  return (
    <fieldset className={styles.interestPicker}>
      <legend className={styles.srOnly}>{label}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <Checkbox
              checked={selected.includes(option.value)}
              onChange={() =>
                onChange(
                  selected.includes(option.value)
                    ? selected.filter((value) => value !== option.value)
                    : [...selected, option.value],
                )
              }
            />
            {selected.includes(option.value) ? (
              <IconCheck size={14} stroke={1.5} aria-hidden="true" />
            ) : (
              <IconBook2 size={14} stroke={1.5} aria-hidden="true" />
            )}
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
