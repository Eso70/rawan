"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconDice,
  IconFeather,
  IconWorld,
  IconMovie,
  IconDeviceGamepad2,
  IconBook,
  IconVolume,
  IconVolumeOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconArrowRight,
  IconX,
} from "@tabler/icons-react";
import { BrandMark } from "../brand-mark";
import { DISCORD_INVITE } from "../site-links";
import {
  cardSteps,
  introScenes,
  type OnboardingState,
  type StoryType,
} from "../../lib/onboarding";
import { ExampleCanvas, ExampleCard, ExampleMap } from "./example-panels";
import styles from "./onboarding.module.css";

const choices = [
  { id: "ttrpg", label: "Planning a TTRPG campaign", Icon: IconDice },
  { id: "fiction", label: "Writing fiction", Icon: IconFeather },
  { id: "worldbuilding", label: "Worldbuilding", Icon: IconWorld },
  { id: "film", label: "Film & TV", Icon: IconMovie },
  { id: "game", label: "Narrative for a game", Icon: IconDeviceGamepad2 },
  { id: "other", label: "Something else", Icon: IconBook },
] as const;
export function Onboarding({ initial }: { initial: OnboardingState }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [draft, setDraft] = useState(initial);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [phase, setPhase] = useState(initial.phase);
  const [step, setStep] = useState(initial.step);
  const [scene, setScene] = useState(0);
  const [line, setLine] = useState(0);
  const [audio, setAudio] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [showText, setShowText] = useState(Boolean(initial.draftText));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tourReady, setTourReady] = useState(false);
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialog = useRef<HTMLDivElement>(null);
  const narrationGeneration = useRef(0);
  const persist = (value: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    queue.current = queue.current.then(async () => {
      try {
        const response = await fetch("/api/onboarding", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (!response.ok) throw new Error();
        return true;
      } catch {
        setError("Your progress could not be saved. Please try again.");
        return false;
      } finally {
        setSaving(false);
      }
    });
    return queue.current;
  };
  const change = (value: Partial<OnboardingState>) => {
    setDraft((old) => ({ ...old, ...value }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const current = draftRef.current;
      void persist({
        draftName: current.draftName.trim() || "Untitled character",
        draftText: current.draftText,
        draftRole: current.draftRole,
        draftImage: current.draftImage,
      });
    }, 500);
  };
  const select = (storyType: StoryType) => {
    setDraft((old) => ({ ...old, storyType }));
    void persist({ storyType });
  };
  const begin = async () => {
    if (!draft.storyType) return;
    if (await persist({ storyType: draft.storyType, phase: "intro" })) {
      setPhase("intro");
      setScene(0);
      setLine(0);
      setPlaying(true);
    }
  };
  const startTour = () => {
    setPhase("tour");
    setStep(0);
    void persist({ phase: "tour", step: 0 });
  };
  const complete = async (skipped = false) => {
    clearTimeout(timer.current);
    const current = draftRef.current;
    if (
      await persist({
        complete: true,
        skipped,
        draftName: current.draftName.trim() || "Untitled character",
        draftText: current.draftText,
        draftRole: current.draftRole,
        draftImage: current.draftImage,
        ...(current.storyType ? { storyType: current.storyType } : {}),
      })
    ) {
      router.push("/workspace");
      router.refresh();
    }
  };
  const move = (value: number) => {
    clearTimeout(timer.current);
    const current = draftRef.current;
    setStep(value);
    void persist({
      phase: "tour",
      step: value,
      draftName: current.draftName.trim() || "Untitled character",
      draftText: current.draftText,
      draftRole: current.draftRole,
      draftImage: current.draftImage,
    });
  };
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    [],
  );
  useEffect(() => {
    if (phase !== "intro" || !playing) return;
    const generation = ++narrationGeneration.current;
    let timeout: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (narrationGeneration.current !== generation) return;
      const current = introScenes[scene];
      if (line < current.lines.length - 1) setLine(line + 1);
      else if (scene < introScenes.length - 1) {
        setScene(scene + 1);
        setLine(0);
      } else {
        setPhase("tour");
        setStep(0);
        void persist({ phase: "tour", step: 0 });
      }
    };
    const text = introScenes[scene].lines[line];
    if (audio && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.94;
      utterance.onend = advance;
      utterance.onerror = () => {
        setAudio(false);
      };
      speechSynthesis.speak(utterance);
    } else
      timeout = setTimeout(
        advance,
        Math.max(3000, text.split(" ").length * 380),
      );
    return () => {
      narrationGeneration.current++;
      clearTimeout(timeout);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    };
    // Narration is driven only by its playback cursor; saves use the existing queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playing, audio, scene, line]);
  useEffect(() => {
    if (phase !== "tour" || !tourReady) return;
    const target = cardSteps[step].target;
    const element =
      target === "finish"
        ? null
        : document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (element)
      element.scrollIntoView({
        block: innerWidth <= 700 ? "center" : "nearest",
        behavior: "instant",
      });
    const measure = () => setRect(element?.getBoundingClientRect() ?? null);
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    dialog.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [phase, step, showText, tourReady]);
  const tooltip = () => {
    if (!rect || step === 4)
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    const width = 336;
    const height = 260;
    const gap = 16;
    const left =
      step === 1
        ? rect.left - width - gap
        : step === 2
          ? rect.left - width - gap
          : rect.left + (rect.width - width) / 2;
    const top =
      step === 0
        ? rect.bottom + gap
        : step === 3
          ? rect.top - height - gap
          : rect.top;
    return {
      left: Math.max(16, Math.min(innerWidth - width - 16, left)),
      top: Math.max(70, Math.min(innerHeight - height - 16, top)),
    };
  };
  const active = introScenes[scene];
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} />
      <header className={styles.header}>
        <a href="/" aria-label="Rawan home">
          <BrandMark />
        </a>
        <button onClick={() => void complete(true)} disabled={saving}>
          Skip
        </button>
      </header>
      <AnimatePresence mode="wait">
        {phase === "choice" ? (
          <motion.div
            key="choice"
            className={styles.choiceLayout}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <section className={styles.choiceText}>
              <h1>
                Let’s start with the kind of
                <br className={styles.desktopBreak} /> story you’re hoping to
                tell
              </h1>
              <div
                className={styles.choices}
                role="group"
                aria-label="Story type"
              >
                {choices.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    aria-pressed={draft.storyType === id}
                    onClick={() => select(id)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
              {draft.storyType && (
                <button
                  className={styles.primary}
                  onClick={() => void begin()}
                  disabled={saving}
                >
                  Begin
                </button>
              )}
            </section>
            <div className={styles.choiceExamples}>
              {draft.storyType === "fiction" ? (
                <ExampleCanvas />
              ) : (
                <ExampleCard draft={draft} />
              )}
              {draft.storyType === "fiction" ? (
                <ExampleCard draft={draft} />
              ) : (
                <ExampleMap />
              )}
            </div>
          </motion.div>
        ) : phase === "intro" ? (
          <motion.div
            key="intro"
            className={styles.intro}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.55 }}
          >
            <h1 className={styles.srOnly}>{active.title}</h1>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.view}
                className={`${styles.presentation} ${active.view === "split" || active.view === "team" ? styles.split : ""}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: reduced ? 0 : 0.65 }}
              >
                {active.view === "canvas" ? (
                  <ExampleCanvas />
                ) : active.view === "split" ? (
                  <>
                    <ExampleCanvas />
                    <ExampleCard draft={draft} />
                  </>
                ) : active.view === "team" ? (
                  <>
                    <ExampleCard draft={draft} />
                    <ExampleMap />
                  </>
                ) : (
                  <ExampleCard draft={draft} onTutorial={startTour} />
                )}
              </motion.div>
            </AnimatePresence>
            <div className={styles.captions} aria-label="Tutorial subtitles">
              <motion.p
                key={`${scene}-${line}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0 : 0.35 }}
              >
                {active.lines[line]}
              </motion.p>
              {line > 0 && <p>{active.lines[line - 1]}</p>}
              {line > 1 && <p>{active.lines[line - 2]}</p>}
            </div>
            <div className={styles.playback}>
              <button
                aria-label={
                  playing ? "Pause introduction" : "Play introduction"
                }
                onClick={() => setPlaying(!playing)}
              >
                {playing ? (
                  <IconPlayerPause size={16} />
                ) : (
                  <IconPlayerPlay size={16} />
                )}
              </button>
              <button
                aria-label={audio ? "Turn narration off" : "Turn narration on"}
                aria-pressed={audio}
                onClick={() => setAudio(!audio)}
              >
                {audio ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
              </button>
              <span>
                {scene + 1} / {introScenes.length}
              </span>
              <button onClick={startTour}>
                Try a card <IconArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tour"
            className={styles.tour}
            onAnimationComplete={() => setTourReady(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          >
            <ExampleCard
              draft={draft}
              editable
              onChange={change}
              showText={showText}
              onText={() => setShowText(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {phase === "tour" && tourReady && (
        <>
          <div
            className={styles.spotlight}
            style={
              rect
                ? {
                    left: rect.left - 6,
                    top: rect.top - 6,
                    width: rect.width + 12,
                    height: rect.height + 12,
                  }
                : { inset: 0, border: 0, borderRadius: 0 }
            }
          />
          <motion.div
            key={step}
            className={styles.tooltip}
            data-step={step}
            style={tooltip()}
            ref={dialog}
            tabIndex={-1}
            role="dialog"
            aria-labelledby="guide-title"
            aria-describedby="guide-description"
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            <div className={styles.tooltipTop}>
              <BrandMark />
              <button
                aria-label="Close tutorial"
                onClick={() => void complete(true)}
                disabled={saving}
              >
                <IconX size={16} />
              </button>
            </div>
            <h2 id="guide-title">{cardSteps[step].title}</h2>
            <p id="guide-description">{cardSteps[step].text}</p>
            <div className={styles.tooltipActions}>
              <span>
                {step + 1} of {cardSteps.length}
              </span>
              <div>
                {step > 0 && (
                  <button onClick={() => move(step - 1)} disabled={saving}>
                    Back
                  </button>
                )}
                <button
                  className={styles.next}
                  onClick={() =>
                    step === 4 ? void complete() : move(step + 1)
                  }
                  disabled={saving}
                >
                  {step === 4 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
      {(saving || error) && (
        <div className={styles.saveStatus} role="status">
          {error || "Saving…"}
          {error && (
            <button
              onClick={() =>
                void persist({
                  phase,
                  step,
                  draftName: draft.draftName.trim() || "Untitled character",
                  draftText: draft.draftText,
                  draftImage: draft.draftImage,
                  draftRole: draft.draftRole,
                })
              }
            >
              Retry
            </button>
          )}
        </div>
      )}
      <a
        className={styles.help}
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Help on Discord"
      >
        ?
      </a>
    </main>
  );
}
