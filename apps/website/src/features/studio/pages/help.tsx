"use client";
import Link from "next/link";
import { useState } from "react";
import {
  IconArrowRight,
  IconBook2,
  IconMessage,
  IconKeyboard,
  IconFeather,
  IconCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import { uid } from "../data/repository";
import {
  PageHeading,
  SectionHeading,
  SearchField,
  Button,
  Modal,
} from "../components/ui";
const topics = [
  {
    title: "Finding your way around",
    text: "Your desk brings you back to the last scene you opened. Projects contain works, manuscripts and optional tools. Use the project switcher to move between stories, or open the command palette with Ctrl/Command + K.",
  },
  {
    title: "Writing and saving",
    text: "Choose a prose work, then a chapter and scene. Your words and formatting save locally after a short pause. Ctrl/Command + S flushes the current editor draft. Move chapters with the up/down buttons. Focus hides navigation; Escape brings it back. All data is stored in this browser, not on a server.",
  },
  {
    title: "People, places and references",
    text: "Worldbuilding entries share one document structure, with room for different kinds of facts. Edit a description, add an alias or property, and link a property to another entry. The reference panel in the manuscript lets you keep a person or place beside your writing.",
  },
  {
    title: "Planning on the canvas",
    text: "Add notes, images, reference entries or plot cards. Drag cards to arrange them and drag between their handles to connect them. Use zoom and fit controls to step back. The Outline view and coordinate fields provide a non-dragging alternative. Canvas convenience types are local mock features.",
  },
  {
    title: "Chronology and relationships",
    text: "Timeline events use clear relative labels and simple ordering numbers in this prototype. Eras group events; related entries open their documents. The relationship graph has name, spacing and layout controls, plus a text list for exploring connections.",
  },
  {
    title: "Images and storage",
    text: "The bundled images are original vector studies. You can add PNG, JPEG or WebP files up to 1 MiB; they are read into local browser storage. If your browser cannot save, keep the tab open and export a backup from Preferences. Avoid editing the demo in several tabs at once.",
  },
  {
    title: "What this demo includes",
    text: "Author Studio is an independent mock application. Rich formatting, custom properties, activity and feedback are local demonstrations, not claims about backend APIs. No real authentication, publishing, team collaboration or reader experience is added. Clearing browser storage removes local edits.",
  },
];
export function HelpPage() {
  const { data, insert, notify } = useStudio();
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(false);
  const [category, setCategory] = useState("Idea");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE GUIDANCE, WHEN YOU NEED IT"
        title="Help & inspiration"
        description="Find an answer, learn a tool, or leave a thought for later."
        actions={
          <Button className="s-button quiet" onClick={() => setFeedback(true)}>
            <IconMessage size={16} />
            Leave feedback
          </Button>
        }
      />
      <div className="s-help-hero">
        <IconFeather size={33} stroke={1.1} />
        <div>
          <h2>Make yourself at home.</h2>
          <p>
            A short introduction to your desk and the work around it. Always
            optional.
          </p>
        </div>
        <Link className="s-button primary" href="/studio?tour=1">
          {data.tourCompleted ? "Restart guided tour" : "Take a little tour"}
          <IconArrowRight size={16} />
        </Link>
      </div>
      <div className="s-help-layout">
        <section>
          <SectionHeading title="A few useful answers" />
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search help topics"
            placeholder="What would you like to know?"
          />
          <div className="s-help-topics">
            {topics
              .filter((t) =>
                `${t.title} ${t.text}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((t) => (
                <details key={t.title}>
                  <summary>
                    <IconBook2 size={17} />
                    {t.title}
                  </summary>
                  <p>{t.text}</p>
                </details>
              ))}
          </div>
          {query &&
            !topics.some((t) =>
              `${t.title} ${t.text}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && (
              <p className="s-empty-inline">
                No help topics match that phrase.
              </p>
            )}
        </section>
        <aside>
          <SectionHeading title="At your fingertips" />
          <div className="s-shortcuts-card">
            <IconKeyboard size={23} stroke={1.2} />
            <p>
              <span>Commands & search</span>
              <kbd>Ctrl / ⌘ K</kbd>
            </p>
            <p>
              <span>Save manuscript</span>
              <kbd>Ctrl / ⌘ S</kbd>
            </p>
            <p>
              <span>Undo / redo</span>
              <kbd>Ctrl / ⌘ Z / ⇧ Z</kbd>
            </p>
            <p>
              <span>Leave focus / dialog</span>
              <kbd>Esc</kbd>
            </p>
          </div>
          <SectionHeading title="What's new" />
          <div className="s-whats-new">
            <IconSparkles size={20} />
            <h3>A space to begin</h3>
            <p>
              The first local Author Studio brings manuscripts, worldbuilding,
              planning and research into one quiet workspace.
            </p>
            <small>Prototype V1 · October 2026</small>
          </div>
          <SectionHeading title="Your local feedback" />
          {data.feedback.length ? (
            data.feedback
              .slice(-3)
              .reverse()
              .map((f) => (
                <div className="s-feedback-entry" key={f.id}>
                  <span>{f.category}</span>
                  <p>{f.message}</p>
                  <small>Saved on this device · not sent</small>
                </div>
              ))
          ) : (
            <p className="s-muted">
              Feedback you save in the demo will appear here. Nothing is sent
              externally.
            </p>
          )}
        </aside>
      </div>
      {feedback && (
        <Modal
          title="A thought about the studio"
          onClose={() => setFeedback(false)}
        >
          <form
            className="s-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim().length < 5) {
                setError(
                  "Write at least five characters so the thought is useful.",
                );
                return;
              }
              insert("feedback", {
                id: uid("feedback"),
                category,
                message: message.trim(),
                at: new Date().toISOString(),
              });
              setFeedback(false);
              setMessage("");
              notify("Feedback saved locally. Nothing was sent externally.");
            }}
          >
            <p className="s-muted">
              This prototype saves feedback on your device. It does not send a
              support request.
            </p>
            <fieldset className="s-feedback-categories">
              <legend className="s-sr">Feedback type</legend>
              {["Bug", "Idea", "Other", "Help"].map((c) => (
                <label key={c} className={category === c ? "active" : ""}>
                  <input
                    className="s-sr"
                    type="radio"
                    name="category"
                    value={c}
                    checked={category === c}
                    onChange={() => setCategory(c)}
                  />
                  {c}
                </label>
              ))}
            </fieldset>
            <label>
              What's on your mind?
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError("");
                }}
                maxLength={4000}
                rows={5}
                required
                minLength={5}
              />
            </label>
            {error && (
              <p role="alert" className="s-error">
                {error}
              </p>
            )}
            <div className="s-dialog-actions">
              <Button
                className="s-button quiet"
                onClick={() => setFeedback(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="s-button primary"
                disabled={message.trim().length < 5}
              >
                <IconCheck size={15} />
                Save feedback locally
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
