"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Experience, Preferences } from "../../lib/experience";
import { dashboardFor } from "../../lib/experience";
import styles from "./preferences.module.css";
const roles = [
  ["author", "Author", "Create books, stories and worlds."],
  ["reader", "Reader", "Read books and discover stories."],
  ["both", "Both", "Write and read, with a dashboard for each."],
  ["explore", "Just exploring", "Start with the reader dashboard."],
] as const;
const genres = [
  ["fiction", "Fiction"],
  ["fantasy", "Fantasy"],
  ["science-fiction", "Sci-Fi"],
  ["romance", "Romance"],
  ["mystery", "Mystery"],
  ["history", "Historical fiction"],
  ["worldbuilding", "Worldbuilding"],
  ["other", "Other"],
];
const writing = [
  ["novel", "A novel"],
  ["short-story", "Short stories"],
  ["world", "A fictional world"],
  ["game", "A game / TTRPG"],
  ["unsure", "Not sure yet"],
];
const reading = [
  ["stories", "Books and stories"],
  ["authors", "Authors"],
  ["worlds", "Fictional worlds"],
  ["unsure", "Not sure yet"],
];
export function PreferencesForm({ initial }: { initial: Preferences }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(
    initial.experience,
  );
  const [interests, setInterests] = useState(initial.interests);
  const [goal, setGoal] = useState<string | null>(initial.goal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (skip = false) => {
    const selected = experience ?? "explore";
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience: selected,
          interests,
          goal: goal ?? "unsure",
          complete: true,
          skipped: skip,
        }),
      });
      if (!response.ok) throw new Error();
      router.replace(dashboardFor(selected));
      router.refresh();
    } catch {
      setError("We couldn’t save your choices. Please try again.");
      setBusy(false);
    }
  };
  const goals =
    experience === "author" || experience === "both" ? writing : reading;
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="question">
        <header>
          <span>Rawan</span>
          <button disabled={busy} onClick={() => void save(true)}>
            Skip for now
          </button>
        </header>
        <p className={styles.progress}>
          Step {step + 1} of 3 · All questions are optional
        </p>
        <h1 id="question" tabIndex={-1}>
          {step === 0
            ? "What brings you to Rawan?"
            : step === 1
              ? "What are you interested in?"
              : experience === "author" || experience === "both"
                ? "What would you like to create?"
                : "What would you like to discover?"}
        </h1>
        <p>
          {step === 0
            ? "Choose the dashboard you’d like to start with. You can change this later."
            : step === 1
              ? "Choose as many as you like."
              : "You can decide later, too."}
        </p>
        <div
          className={styles.options}
          role="group"
          aria-label={
            step === 0 ? "Your role" : step === 1 ? "Interests" : "Your goal"
          }
        >
          {step === 0
            ? roles.map(([value, label, description]) => (
                <button
                  key={value}
                  disabled={busy}
                  aria-pressed={experience === value}
                  onClick={() => {
                    setExperience(value);
                    setGoal(null);
                  }}
                >
                  <strong>{label}</strong>
                  <span>{description}</span>
                </button>
              ))
            : step === 1
              ? genres.map(([value, label]) => (
                  <button
                    key={value}
                    disabled={busy}
                    aria-pressed={interests.includes(value)}
                    onClick={() =>
                      setInterests((old) =>
                        old.includes(value)
                          ? old.filter((item) => item !== value)
                          : [...old, value],
                      )
                    }
                  >
                    {label}
                  </button>
                ))
              : goals.map(([value, label]) => (
                  <button
                    key={value}
                    disabled={busy}
                    aria-pressed={goal === value}
                    onClick={() => setGoal(value)}
                  >
                    {label}
                  </button>
                ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <footer>
          {step > 0 && (
            <button disabled={busy} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button
            className={styles.primary}
            disabled={busy}
            onClick={() => (step < 2 ? setStep(step + 1) : void save())}
          >
            {busy ? "Saving…" : step < 2 ? "Continue" : "Enter Rawan"}
          </button>
        </footer>
      </section>
    </main>
  );
}
