"use client";

import { useRef, useState } from "react";
import {
  IconArrowLeft, IconArrowRight, IconArrowUpRight, IconBook2,
  IconBrandDiscord, IconBrandInstagram, IconBrandYoutube,
  IconChevronDown, IconExternalLink, IconListDetails, IconMessageCircle,
  IconMessage, IconPlayerPlay, IconQuestionMark, IconSchool, IconUser, IconX,
} from "@tabler/icons-react";
import { DISCORD_INVITE } from "../../components/shared/site-links";
import styles from "./studio-help.module.css";

const guides = [
  {
    title: "Write your first book",
    description: "A home for your chapters, scenes, and ideas",
    steps: ["Choose Book from the center of your writing space, or use New document in the top bar.", "Give your book a title, then start writing in the page below it.", "Your draft saves automatically on this device. Open it again from the document sidebar."],
  },
  {
    title: "Creating",
    description: "Make books, comics, characters, and notes",
    steps: ["Choose New document to see all available document types.", "Use Comic for a page-and-panel script, or Character to keep a character’s name, role, and story together.", "Keep your planning nearby with Outline, Note, and Place. Import an existing .txt or .md file from the sidebar."],
  },
  {
    title: "Studio basics",
    description: "Your sidebar, tabs, and first document",
    steps: ["Click the Rawan mark to open the outer navigation. Your writing space stays inside its rounded screen.", "Use the small sidebar toggle to hide or show your documents. Search and filter to find a draft.", "Choose Author Studio to return to the writing space. Your drafts remain saved locally on this device."],
  },
  {
    title: "Characters and places",
    description: "Keep the people and places in your story close",
    steps: ["Choose Character to create a profile with a name, role, and description.", "Choose Place under More to describe a location and its atmosphere.", "Find profiles using the sidebar’s document-type filter."],
  },
  {
    title: "What’s new",
    description: "The latest in your writing space",
    steps: ["Your writing dashboard now sits inside a rounded parent shell with an independent navigation rail.", "Books, comic scripts, characters, outlines, notes, and places share one writing space.", "Backgrounds change automatically with the time and season. Motion follows your device preferences."],
  },
];

export function StudioHelp() {
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [guideIndex, setGuideIndex] = useState<number | null>(null);
  const guide = guideIndex === null ? null : guides[guideIndex];

  return (
    <>
      <button className={styles.trigger} aria-label="Help" aria-expanded={open} popoverTarget="studio-help">
        <IconQuestionMark size={17} />
      </button>
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
          {guide && <button aria-label="Back to Help" onClick={() => setGuideIndex(null)}><IconArrowLeft size={16} /></button>}
          <h2>{guide ? guide.title : "Help"}</h2>
          <button aria-label="Close Help" onClick={() => panel.current?.hidePopover()}><IconX size={17} /></button>
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
              {guides.slice(0, expanded ? 4 : 3).map((item, index) => (
                <button className={styles.tutorial} key={item.title} onClick={() => setGuideIndex(index)}>
                  <span className={styles.lessonIcon}><IconSchool size={15} stroke={1.5} /></span>
                  <span><strong>{item.title}</strong><small>{item.description}</small></span>
                  <IconArrowRight className={styles.arrow} size={15} stroke={1.5} />
                </button>
              ))}
              <button className={styles.disclosure} aria-label={expanded ? "Show fewer tutorials" : "Show more tutorials"} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
                <IconChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
              </button>
            </section>
            <section className={styles.section} aria-label="Video tutorials">
              <div className={styles.sectionTitle}><h3>Video tutorials</h3><span>Coming soon</span></div>
              {[
                { title: "Getting started with Rawan", Icon: IconBook2 },
                { title: "Your writing space", Icon: IconListDetails },
                { title: "Characters & comic scripts", Icon: IconUser },
              ].map(({ title, Icon }) => (
                <button className={styles.video} key={title} disabled title="Video tutorial coming soon">
                  <span className={styles.thumbnail}><Icon size={27} stroke={1} /><span><IconPlayerPlay size={12} /></span></span>
                  <strong>{title}</strong><IconArrowUpRight className={styles.arrow} size={15} />
                </button>
              ))}
              <span className={styles.videoEnd} aria-hidden="true"><IconChevronDown size={15} /></span>
            </section>
            <nav className={styles.actions} aria-label="Help resources">
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><IconMessageCircle size={17} stroke={1.5} />Get help<IconExternalLink className={styles.arrow} size={13} /></a>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><IconMessage size={17} stroke={1.5} />Send feedback<IconExternalLink className={styles.arrow} size={13} /></a>
              <button onClick={() => setGuideIndex(4)}><IconListDetails size={17} stroke={1.5} />What’s new</button>
            </nav>
            <footer className={styles.community}>
              <span>Community</span>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" aria-label="Rawan Discord community" title="Discord"><IconBrandDiscord size={17} /></a>
              <button disabled aria-label="Instagram — coming soon" title="Instagram — coming soon"><IconBrandInstagram size={16} /></button>
              <button disabled aria-label="YouTube — coming soon" title="YouTube — coming soon"><IconBrandYoutube size={17} /></button>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
