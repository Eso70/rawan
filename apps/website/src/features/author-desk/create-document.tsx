"use client";

import { useState } from "react";
import { IconBook2, IconLayoutBoard, IconUser, IconListTree, IconNotes, IconMapPin, IconUpload, IconPlus } from "@tabler/icons-react";
import type { DocumentKind } from "./documents";
import styles from "./create-document.module.css";

const types = [
  { kind: "Book", Icon: IconBook2, summary: "Chapters, scenes, and the story you want to tell.", placeholder: "What is your book about?" },
  { kind: "Comic", Icon: IconLayoutBoard, summary: "Plan your pages, panels, action, and dialogue.", placeholder: "Describe your comic’s story or opening scene…" },
  { kind: "Character", Icon: IconUser, summary: "Give the people in your story a place of their own.", placeholder: "Who are they? What do they want?" },
  { kind: "Outline", Icon: IconListTree, summary: "Find the shape of your story, one beat at a time.", placeholder: "Where does the story begin?" },
  { kind: "Note", Icon: IconNotes, summary: "Keep a thought, a detail, or a little inspiration.", placeholder: "What would you like to remember?" },
  { kind: "Place", Icon: IconMapPin, summary: "Build the places your characters call home.", placeholder: "Describe this place and its atmosphere…" },
] as const;

export function CreateDocument({ onCreate, onImport, disabled }: {
  onCreate: (kind: DocumentKind, text: string, title: string) => void;
  onImport: () => void;
  disabled: boolean;
}) {
  const [kind, setKind] = useState<DocumentKind>("Book");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const selected = types.find((type) => type.kind === kind)!;
  const Icon = selected.Icon;

  return (
    <form className={styles.layout} onSubmit={(event) => {
      event.preventDefault();
      onCreate(kind, description, title.trim());
    }}>
      <nav className={styles.navigation} aria-label="Document type">
        <div className={styles.types}>
          {types.map(({ kind: option, Icon: TypeIcon }) => (
            <button type="button" key={option} aria-pressed={kind === option} onClick={() => setKind(option)}>
              <TypeIcon size={17} stroke={1.7} /><span>{option}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.import} onClick={onImport}><IconUpload size={17} stroke={1.6} />Import writing</button>
      </nav>
      <div className={styles.details}>
        <div className={styles.identity}>
          <div className={styles.cover} aria-hidden="true"><Icon size={60} stroke={1.2} /></div>
          <div className={styles.fields}>
            <label><span>{kind === "Character" ? "Name" : "Title"}</span><input aria-label={kind === "Character" ? "Character name" : "Document title"} placeholder={kind === "Character" ? "Character name" : `Untitled ${kind.toLowerCase()}`} value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} /></label>
            <label><span>Description</span><textarea aria-label="Description" placeholder={selected.placeholder} value={description} maxLength={200000} onChange={(event) => setDescription(event.target.value)} /></label>
          </div>
        </div>
        <span className={styles.typeBadge}><Icon size={12} />{kind}</span>
        <h3>Your {kind.toLowerCase()}</h3>
        <div className={styles.summary}>
          <Icon size={40} stroke={1.2} aria-hidden="true" />
          <div><strong>{selected.summary}</strong><p>You can keep editing after you create it. Your writing saves automatically on this device.</p></div>
        </div>
        <footer className={styles.footer}><button type="submit" disabled={disabled}><IconPlus size={15} />Create {kind.toLowerCase()}</button></footer>
      </div>
    </form>
  );
}
