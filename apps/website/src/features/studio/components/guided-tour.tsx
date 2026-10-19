"use client";
import { useEffect, useRef, useState } from "react";
import { IconFeather, IconX, IconArrowRight } from "@tabler/icons-react";
import { Button, IconButton } from "./ui";
const steps = [
  {
    target: "search",
    title: "A thought is never far away.",
    body: "Find a project, a character, or a phrase from your manuscript. Ctrl or Command + K opens search and useful actions from anywhere in the studio.",
  },
  {
    target: "continue",
    title: "Come back to the page.",
    body: "Continue writing returns to the last scene you opened. Your manuscript, formatting, and chapter order are saved in this browser.",
  },
  {
    target: "projects",
    title: "Give each idea a home.",
    body: "A project holds its books, notes, and optional creative tools. Open one to move between writing, worldbuilding, and planning.",
  },
  {
    target: "tour-help",
    title: "Find your own way through.",
    body: "Nothing here needs to be learned all at once. Help and shortcuts are always available, and this tour can be restarted whenever you like.",
  },
];
export function GuidedTour({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [position, setPosition] = useState({ top: 150, left: 300 });
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const before = document.activeElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, []);
  useEffect(() => {
    const target = document.querySelector<HTMLElement>(
      `[data-tour="${steps[step].target}"]`,
    );
    if (target)
      target.scrollIntoView({ behavior: "instant", block: "nearest" });
    const measure = () => {
      const r = target?.getBoundingClientRect();
      if (r && r.width && r.height && r.right > 0 && r.left < innerWidth) {
        setRect({
          top: Math.max(5, r.top - 5),
          left: Math.max(5, r.left - 5),
          width: Math.min(r.width + 10, innerWidth - 10),
          height: Math.min(r.height + 10, innerHeight - 10),
        });
        setPosition({
          left: Math.max(14, Math.min(r.left, innerWidth - 374)),
          top:
            r.bottom + 310 < innerHeight
              ? r.bottom + 18
              : Math.max(18, r.top - 294),
        });
      } else {
        setRect(null);
        setPosition({
          left: Math.max(14, (innerWidth - 350) / 2),
          top: Math.max(18, (innerHeight - 270) / 2),
        });
      }
    };
    measure();
    heading.current?.focus({ preventScroll: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);
  return (
    <dialog
      className="s-tour-dialog"
      ref={dialog}
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {rect ? (
        <div aria-hidden="true" className="s-tour-highlight" style={rect} />
      ) : (
        <div className="s-tour-dimmer" aria-hidden="true" />
      )}
      <section className="s-tour-popover" style={position}>
        <div className="s-row">
          <IconFeather size={22} stroke={1.3} />
          <IconButton className="s-icon" label="Close tour" onClick={onClose}>
            <IconX size={17} />
          </IconButton>
        </div>
        <h2 id="tour-title" tabIndex={-1} ref={heading}>
          {steps[step].title}
        </h2>
        <p id="tour-description">{steps[step].body}</p>
        <div className="s-tour-footer">
          <span aria-live="polite">
            {step + 1} of {steps.length}
          </span>
          <Button className="s-text-button" onClick={onClose}>
            Skip
          </Button>
          {step > 0 && (
            <Button
              className="s-button quiet"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button
            className="s-button primary"
            onClick={() =>
              step === steps.length - 1 ? onFinish() : setStep(step + 1)
            }
          >
            {step === steps.length - 1 ? "Finish" : "Next"}
            <IconArrowRight size={14} />
          </Button>
        </div>
      </section>
    </dialog>
  );
}
