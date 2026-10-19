import {
  IconBook2,
  IconCheck,
  IconFeather,
  IconMovie,
  IconPalette,
  IconWriting,
  IconCompass,
  IconLibrary,
  IconWorld,
  IconSearch,
  IconHeart,
  IconBrain,
  IconAtom,
} from "@tabler/icons-react";
import { Checkbox } from "../../../components/ui/controls";
import type { OnboardingDraft } from "../model";
import {
  interestCategories,
  interestOptions,
  type InterestField,
  type InterestPhase,
} from "../interest-flow";
import { InterestPicker } from "./interest-picker";
import styles from "../onboarding.module.css";

const icons: Record<string, typeof IconBook2> = {
  "creative-0": IconBook2,
  "creative-1": IconLibrary,
  "creative-2": IconPalette,
  "creative-3": IconMovie,
  "creative-poetry": IconFeather,
  "creative-essays": IconWriting,
  "creative-worlds": IconWorld,
  "creative-journals": IconWriting,
  "creative-life": IconWriting,
  "creative-young": IconBook2,
  "creative-audio": IconMovie,
  "reading-books": IconBook2,
  "reading-visual": IconPalette,
  "reading-poetry": IconFeather,
  "reading-fantasy": IconCompass,
  "reading-mystery": IconSearch,
  "reading-fiction": IconHeart,
  "reading-mind": IconBrain,
  "reading-history": IconWorld,
  "reading-science": IconAtom,
  "reading-cozy": IconHeart,
  "reading-myths": IconWorld,
  "reading-humor": IconFeather,
  "reading-nature": IconCompass,
  "reading-arts": IconPalette,
};
const fields: { field: InterestField; label: string }[] = [
  { field: "creativeInterests", label: "Creating" },
  { field: "readingFormats", label: "Reading formats" },
  { field: "readingGenres", label: "Reading genres" },
  { field: "readingTopics", label: "Reading topics" },
];
export function InterestQuestions({
  draft,
  phase,
  selectedCategories,
  onCategoriesChange,
  update,
}: {
  draft: OnboardingDraft;
  phase: InterestPhase;
  selectedCategories: string[];
  onCategoriesChange: (values: string[]) => void;
  update: <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K],
  ) => void;
}) {
  const categories = interestCategories(draft.purpose);
  if (phase === "categories")
    return (
      <div className={styles.interestQuestions}>
        {([true, false] as const).map((creative) => {
          const visible = categories.filter(
            (category) => (category.field === "creativeInterests") === creative,
          );
          if (!visible.length) return null;
          return (
            <fieldset className={styles.interestPicker} key={String(creative)}>
              <legend
                className={
                  draft.purpose === "both"
                    ? styles.interestLabel
                    : styles.srOnly
                }
              >
                {creative ? "Creating" : "Reading"}
              </legend>
              <div className={styles.chips}>
                {visible.map((category) => {
                  const checked = selectedCategories.includes(category.id);
                  const Icon = icons[category.id] ?? IconBook2;
                  return (
                    <label key={category.id} className={styles.chip}>
                      <Checkbox
                        checked={checked}
                        onChange={() =>
                          onCategoriesChange(
                            checked
                              ? selectedCategories.filter(
                                  (id) => id !== category.id,
                                )
                              : [...selectedCategories, category.id],
                          )
                        }
                      />
                      {checked ? (
                        <IconCheck size={14} stroke={1.5} aria-hidden="true" />
                      ) : (
                        <Icon size={14} stroke={1.5} aria-hidden="true" />
                      )}
                      <span>{category.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    );
  return (
    <div className={styles.interestQuestions}>
      {fields.map(({ field, label }) => {
        const options = interestOptions(
          draft.purpose,
          selectedCategories,
          field,
        );
        if (!options.length) return null;
        return (
          <section
            key={field}
            className={styles.interestSection}
            aria-label={label}
          >
            {fields.filter(
              (item) =>
                interestOptions(draft.purpose, selectedCategories, item.field)
                  .length,
            ).length > 1 && <h2>{label}</h2>}
            <InterestPicker
              label={label}
              options={options}
              selected={draft[field]}
              onChange={(values) => update(field, values)}
            />
          </section>
        );
      })}
    </div>
  );
}
