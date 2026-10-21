"use client";

import { StudioButton, StudioLink } from "../../components/ui/tooltip";

import { useRef, useState } from "react";
import {
  IconArrowLeft, IconArrowRight, IconBrandDiscord,
  IconExternalLink, IconMessageCircle, IconMessage, IconQuestionMark, IconSchool, IconX,
} from "@tabler/icons-react";
import { DISCORD_INVITE } from "../../components/shared/site-links";
import styles from "./studio-help.module.css";

const guides = [
  {
    title: "Design your book",
    description: "Fonts, paper, margins, and book pages",
    steps: ["Choose Design in the writing ribbon to choose a document font, upload a font file, or request device-font access.", "Use Layout for book size, margins, and binding space. Design contains indents, spacing, and drop caps.", "Toggle Live preview to see formatted pages alongside your writing, or open Book view for the complete book. Print / PDF opens your browser’s print dialog."],
  },
  {
    title: "Write your first book",
    description: "From a title to your first chapter",
    steps: ["Choose Create Book in the center or New Book in the sidebar. The top + opens a Book menu.", "Add a title, an optional subtitle, and choose a book type. You can add front, back and spine cover images.", "Choose Create First Chapter to open your manuscript editor."],
  },
  {
    title: "Writing and chapters",
    description: "Your manuscript, one chapter at a time",
    steps: ["Create a chapter using the book workspace or the book’s sidebar row.", "Click the chapter title above the page to rename it. Use the formatting bar for headings, emphasis, lists, quotations and scene breaks.", "Switch chapters in the sidebar or choose the book tab to return to your manuscript."],
  },
  {
    title: "Studio basics",
    description: "Your books, tabs, and writing space",
    steps: ["Click the Rawan mark to open the outer navigation. Your writing space stays inside its rounded screen.", "Hide or show your books with the document-sidebar toggle. Search to find a book by title.", "Choose My Books or Author Studio to return home."],
  },
];

export function StudioHelp() {
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [guideIndex, setGuideIndex] = useState<number | null>(null);
  const guide = guideIndex === null ? null : guides[guideIndex];

  return (
    <>
      <StudioButton className={styles.trigger} aria-label="Help" aria-expanded={open} popoverTarget="studio-help">
        <IconQuestionMark size={17} />
      </StudioButton>
      <div
        ref={panel}
        id="studio-help"
        popover="auto"
        role="dialog"
        aria-label="Help"
        className={styles.panel}
        onToggle={(event) => {
          setOpen(event.newState === "open");
          if (event.newState === "closed") setGuideIndex(null);
        }}
      >
        <header className={styles.heading}>
          {guide && <StudioButton aria-label="Back to Help" onClick={() => setGuideIndex(null)}><IconArrowLeft size={16} /></StudioButton>}
          <h2>{guide ? guide.title : "Help"}</h2>
          <StudioButton aria-label="Close Help" onClick={() => panel.current?.hidePopover()}><IconX size={17} /></StudioButton>
        </header>
        {guide ? (
          <div className={styles.guide}>
            <p>{guide.description}</p>
            <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
        ) : (
          <>
            <section className={styles.section} aria-label="Tutorials">
              <h3>Tutorials</h3>
              {guides.map((item, index) => (
                <StudioButton className={styles.tutorial} key={item.title} onClick={() => setGuideIndex(index)}>
                  <span className={styles.lessonIcon}><IconSchool size={15} stroke={1.5} /></span>
                  <span><strong>{item.title}</strong><small>{item.description}</small></span>
                  <IconArrowRight className={styles.arrow} size={15} stroke={1.5} />
                </StudioButton>
              ))}
            </section>
            <nav className={styles.actions} aria-label="Help resources">
              <StudioLink tooltip="Get help in the Rawan Discord community" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><IconMessageCircle size={17} stroke={1.5} />Get help<IconExternalLink className={styles.arrow} size={13} /></StudioLink>
              <StudioLink tooltip="Share feedback in the Rawan Discord community" href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><IconMessage size={17} stroke={1.5} />Send feedback<IconExternalLink className={styles.arrow} size={13} /></StudioLink>
            </nav>
            <footer className={styles.community}>
              <span>Community</span>
              <StudioLink href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" aria-label="Rawan Discord community" title="Discord"><IconBrandDiscord size={17} /></StudioLink>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
