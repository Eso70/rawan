"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconPin,
  IconTrash,
  IconFolder,
  IconCheck,
  IconPencil,
  IconArrowUpRight,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import { projectPath, uid } from "../data/repository";
import {
  PageHeading,
  CreateButton,
  SearchField,
  Button,
  IconButton,
  FormDialog,
  ConfirmDialog,
  Badge,
  EmptyState,
  SectionHeading,
} from "../components/ui";
export function ResearchPage({ projectId }: { projectId: string }) {
  const { data, insert, patch, remove, notify } = useStudio();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("All notes");
  const [create, setCreate] = useState(params.get("create") === "1");
  const [edit, setEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tag, setTag] = useState("All tags");
  const all = data.notes.filter((n) => n.projectId === projectId);
  const notes = all
    .filter(
      (n) =>
        (folder === "All notes" ||
          (folder === "Pinned" ? n.pinned : n.folder === folder)) &&
        (tag === "All tags" || n.tags.includes(tag)) &&
        `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
  const note = notes.find((n) => n.id === params.get("note")) ?? notes[0];
  const folders = [...new Set(all.map((n) => n.folder))];
  return (
    <>
      <PageHeading
        eyebrow="THOUGHTS WORTH KEEPING"
        title="Research & notes"
        description="A place for observations, questions, and things you don't want to lose."
        actions={
          <CreateButton onClick={() => setCreate(true)}>New note</CreateButton>
        }
      />
      <div className="s-research-layout">
        <aside className="s-notes-library">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search your notes…"
            label="Search notes"
          />
          <div className="s-folder-tabs">
            {["All notes", "Pinned", ...folders].map((f) => (
              <Button
                key={f}
                aria-pressed={folder === f}
                onClick={() => setFolder(f)}
              >
                {f === "Pinned" ? (
                  <IconPin size={13} />
                ) : (
                  <IconFolder size={13} />
                )}
                {f}
              </Button>
            ))}
          </div>
          <label className="s-note-tag-filter">
            <span className="s-sr">Filter note tags</span>
            <select value={tag} onChange={(e) => setTag(e.target.value)}>
              {["All tags", ...new Set(all.flatMap((n) => n.tags))].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="s-note-list">
            {notes.map((n) => (
              <Button
                key={n.id}
                className={n.id === note?.id ? "active" : ""}
                onClick={() =>
                  router.replace(
                    `${projectPath(projectId, "research")}?note=${n.id}`,
                    { scroll: false },
                  )
                }
              >
                <span className="s-eyebrow">
                  {n.folder}
                  {n.pinned && <IconPin size={12} />}
                </span>
                <strong>{n.title}</strong>
                <p>{n.content.slice(0, 100)}…</p>
                <span className="s-tags">
                  {n.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
              </Button>
            ))}
          </div>
          {!notes.length && (
            <p className="s-empty-inline">No notes in this view.</p>
          )}
        </aside>
        <section className="s-note-document">
          {note ? (
            <>
              <div className="s-row">
                <Badge>{note.folder}</Badge>
                <div className="s-actions">
                  <IconButton
                    className={`s-icon ${note.pinned ? "accent" : ""}`}
                    label={note.pinned ? "Unpin note" : "Pin note"}
                    aria-pressed={note.pinned}
                    onClick={() =>
                      patch("notes", note.id, { pinned: !note.pinned })
                    }
                  >
                    <IconPin size={17} />
                  </IconButton>
                  <IconButton
                    className="s-icon"
                    label="Edit note metadata"
                    onClick={() => setEdit(true)}
                  >
                    <IconPencil size={16} />
                  </IconButton>
                  <IconButton
                    className="s-icon"
                    label="Delete note"
                    onClick={() => setDeleting(true)}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </div>
              </div>
              <label>
                <span className="s-sr">Note title</span>
                <input
                  className="s-note-title"
                  value={note.title}
                  maxLength={200}
                  onChange={(e) =>
                    patch("notes", note.id, {
                      title: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  onBlur={(e) => {
                    if (!e.target.value.trim())
                      patch("notes", note.id, { title: "Untitled note" });
                  }}
                />
              </label>
              <p className="s-meta">
                {data.projects.find((p) => p.id === projectId)?.title} · Private
                notes
              </p>
              <label>
                <span className="s-sr">Note content</span>
                <textarea
                  className="s-note-body"
                  value={note.content}
                  onChange={(e) =>
                    patch("notes", note.id, {
                      content: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  placeholder="Follow a thought…"
                />
              </label>
              <div className="s-row">
                <span className="s-meta">
                  <IconCheck size={12} /> Changes save locally
                </span>
                <span className="s-meta">
                  {note.content.trim()
                    ? note.content.trim().split(/\s+/).length
                    : 0}{" "}
                  words
                </span>
              </div>
              <SectionHeading title="Related references" />
              {note.entityIds.map((id) => {
                const e = data.entities.find((e) => e.id === id);
                return e ? (
                  <Link
                    className="s-entity-chip"
                    key={id}
                    href={projectPath(projectId, `world/${id}`)}
                  >
                    {e.name}
                    <IconArrowUpRight size={12} />
                  </Link>
                ) : null;
              })}
              <p className="s-local-note">
                Folders and pinning are local mock organization. Source/citation
                integration is a separate backend mapping.
              </p>
            </>
          ) : (
            <EmptyState
              title="Keep a thought"
              description="Start a note, collect a question, or save a detail for later."
              action={
                <CreateButton onClick={() => setCreate(true)}>
                  Create note
                </CreateButton>
              }
            />
          )}
        </section>
      </div>
      {(create || (edit && note)) && (
        <FormDialog
          title={create ? "A thought for later" : "Organize this note"}
          onClose={() => {
            setCreate(false);
            setEdit(false);
          }}
          fields={[
            {
              key: "title",
              label: "Note title",
              required: true,
              value: create ? "" : note?.title,
            },
            {
              key: "folder",
              label: "Folder",
              value: create ? "Draft notes" : note?.folder,
              required: true,
            },
            {
              key: "tags",
              label: "Tags, separated by commas",
              value: create ? "" : note?.tags.join(", "),
            },
            {
              key: "entity",
              label: "Linked reference",
              type: "select",
              options: [
                "None",
                ...data.entities
                  .filter((e) => e.projectId === projectId)
                  .map((e) => e.name),
              ],
              value: create
                ? "None"
                : (data.entities.find((e) => e.id === note?.entityIds[0])
                    ?.name ?? "None"),
            },
          ]}
          onSubmit={(v) => {
            const entity = data.entities.find(
              (e) => e.projectId === projectId && e.name === v.entity,
            );
            const values = {
              title: v.title.trim(),
              folder: v.folder.trim(),
              tags: [
                ...new Set(
                  v.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                ),
              ],
              entityIds: entity ? [entity.id] : [],
              updatedAt: new Date().toISOString(),
            };
            if (create) {
              const id = uid("note");
              insert("notes", {
                ...values,
                id,
                projectId,
                content: "",
                pinned: false,
              });
              setFolder("All notes");
              setQuery("");
              setTag("All tags");
              router.replace(
                `${projectPath(projectId, "research")}?note=${id}`,
              );
            } else if (note) patch("notes", note.id, values);
            notify("Note saved on this device.");
          }}
        />
      )}
      {deleting && note && (
        <ConfirmDialog
          title={`Delete “${note.title}”?`}
          description="This note will be removed from the local demo."
          onClose={() => setDeleting(false)}
          onConfirm={() => remove("notes", note.id)}
        />
      )}
    </>
  );
}
