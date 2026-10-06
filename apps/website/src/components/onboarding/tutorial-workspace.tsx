"use client";
import { useState } from "react";
import {
  IconCards,
  IconMap,
  IconGridDots,
  IconTimeline,
  IconChevronDown,
  IconChevronRight,
  IconSearch,
  IconSchool,
  IconX,
  IconNotes,
} from "@tabler/icons-react";
import { BrandMark } from "../brand-mark";
import { DISCORD_INVITE } from "../site-links";
import { ExampleCard, ExampleCanvas, ExampleMap } from "./example-panels";
import type { OnboardingState } from "../../lib/onboarding";
import styles from "./onboarding.module.css";

const tools = [
  { id: "card", label: "Card", Icon: IconCards },
  { id: "map", label: "Map", Icon: IconMap },
  { id: "canvas", label: "Canvas", Icon: IconGridDots },
  { id: "timeline", label: "Timeline", Icon: IconTimeline },
] as const;
export function TutorialWorkspace({
  name,
  state,
}: {
  name: string;
  state: OnboardingState;
}) {
  const [view, setView] = useState("");
  const [search, setSearch] = useState("");
  const [more, setMore] = useState(false);
  return (
    <main className={styles.page}>
      <div className={styles.backdrop} />
      <header className={styles.workspaceHeader}>
        <a href="/" aria-label="Rawan home">
          <BrandMark />
        </a>
        <span>Lumia (tutorial)</span>
        <span>
          <IconMap size={14} /> World
        </span>
        <div>
          <a href="/onboarding?replay=1">Replay onboarding</a>
          <form action="/auth/logout" method="post">
            <button>Sign out</button>
          </form>
        </div>
      </header>
      <aside className={styles.sidebar}>
        <label>
          <IconSearch size={16} />
          <input
            placeholder="Search tutorial"
            aria-label="Search tutorial documents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <nav aria-label="Tutorial documents">
          {[
            { label: "Tutorial", view: "guide", Icon: IconSchool },
            { label: "Lumia Timeline", view: "timeline", Icon: IconTimeline },
            { label: "Canvases", view: "canvas", Icon: IconGridDots },
            { label: "Locations", view: "map", Icon: IconMap },
            { label: "Characters", view: "card", Icon: IconCards },
          ]
            .filter((item) =>
              item.label.toLowerCase().includes(search.toLowerCase()),
            )
            .map(({ label, view, Icon }) =>
              view === "guide" ? (
                <a key={label} href="/onboarding?replay=1">
                  <Icon size={15} />
                  {label}
                </a>
              ) : (
                <button key={label} onClick={() => setView(view)}>
                  <Icon size={15} />
                  {label}
                  <IconChevronRight size={13} />
                </button>
              ),
            )}
        </nav>
        <p>
          Welcome, {name}.<br />
          This is your tutorial world.
        </p>
      </aside>
      {view ? (
        <section className={styles.workspacePanel}>
          <button
            className={styles.closePanel}
            onClick={() => setView("")}
            aria-label="Close sample panel"
          >
            <IconX size={18} />
          </button>
          {view === "card" ? (
            <ExampleCard
              draft={state}
              onTutorial={() => window.location.assign("/onboarding?replay=1")}
            />
          ) : view === "map" ? (
            <ExampleMap />
          ) : view === "canvas" ? (
            <ExampleCanvas />
          ) : view === "notes" ? (
            <section className={styles.timeline}>
              <h1>Story notes</h1>
              <p>
                {state.draftText ||
                  "Write a first line in the card tutorial to add your own story note."}
              </p>
              <a href="/onboarding?replay=1">Edit your tutorial card</a>
            </section>
          ) : (
            <section className={styles.timeline}>
              <h1>Lumia Timeline</h1>
              {[
                "A letter arrives in Redwake Harbor",
                "The Mirewalker follows the flooded road",
                "A light appears in the forgotten tower",
                "The travelers meet at dawn",
              ].map((text, i) => (
                <article key={text}>
                  <small>Day {i + 1}</small>
                  <p>{text}</p>
                </article>
              ))}
            </section>
          )}
        </section>
      ) : (
        <section className={styles.launchpad} aria-label="Tutorial world tools">
          <div>
            {tools.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setView(id)}>
                <span>
                  <Icon size={28} />
                </span>
                {label}
              </button>
            ))}
            <div className={styles.more}>
              <button aria-expanded={more} onClick={() => setMore(!more)}>
                <span>
                  <IconChevronDown size={28} />
                </span>
                More
              </button>
              {more && (
                <div>
                  <button
                    onClick={() => {
                      setView("notes");
                      setMore(false);
                    }}
                  >
                    <IconNotes size={16} /> Notes
                  </button>
                  <a href="/onboarding?replay=1">Tutorial</a>
                </div>
              )}
            </div>
          </div>
          <a className={styles.explore} href="/onboarding?replay=1">
            <IconSchool size={15} /> Explore tools
          </a>
        </section>
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
