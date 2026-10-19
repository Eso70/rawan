"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  IconArrowDown,
  IconArrowUp,
  IconBold,
  IconItalic,
  IconH2,
  IconPilcrow,
  IconList,
  IconQuote,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconFocus2,
  IconLayoutSidebarRight,
  IconPlus,
  IconChevronRight,
  IconCheck,
  IconFeather,
  IconX,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import {
  addChapter,
  plainText,
  projectPath,
  reorderChapter,
  uid,
  wordCount,
  DRAFT_KEY,
} from "../data/repository";
import type { Scene } from "../data/models";
import {
  Button,
  IconButton,
  FormDialog,
  SearchField,
  Badge,
  EmptyState,
} from "../components/ui";

function RichWritingSurface({
  scene,
  onSave,
}: {
  scene: Scene;
  onSave: (html: string) => void;
}) {
  const [html, setHtml] = useState(scene.content);
  const [dirty, setDirty] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [, selectionChanged] = useState(0);
  const pending = useRef(scene.content);
  const changed = useRef(false);
  const save = useRef(onSave);
  save.current = onSave;
  const flush = () => {
    if (changed.current) {
      save.current(pending.current);
      changed.current = false;
      setDirty(false);
    }
  };
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: scene.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "s-tiptap",
        role: "textbox",
        "aria-label": "Manuscript content",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      const value = editor.getHTML();
      setHtml(value);
      pending.current = value;
      changed.current = true;
      setDirty(true);
      try {
        localStorage.setItem(
          DRAFT_KEY + scene.id,
          JSON.stringify({ content: value, at: new Date().toISOString() }),
        );
        setDraftError(false);
      } catch {
        setDraftError(true);
      }
    },
    onSelectionUpdate: () => selectionChanged((n) => n + 1),
  });
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(flush, 600);
    return () => clearTimeout(timer);
  }, [html, dirty]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };
    const leave = () => {
      if (changed.current) {
        save.current(pending.current);
        changed.current = false;
      }
    };
    document.addEventListener("keydown", key);
    window.addEventListener("pagehide", leave);
    return () => {
      leave();
      document.removeEventListener("keydown", key);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  if (!editor)
    return (
      <div className="s-loading" role="status">
        Opening the page…
      </div>
    );
  const tools = [
    {
      label: "Paragraph",
      Icon: IconPilcrow,
      active: editor.isActive("paragraph"),
      action: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Heading",
      Icon: IconH2,
      active: editor.isActive("heading"),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bold",
      Icon: IconBold,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      Icon: IconItalic,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Bullet list",
      Icon: IconList,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Block quote",
      Icon: IconQuote,
      active: editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];
  return (
    <>
      <div className="s-editor-toolbar" aria-label="Manuscript formatting">
        {tools.map(({ label, Icon, active, action }) => (
          <IconButton
            label={label}
            key={label}
            aria-pressed={active}
            className="s-icon"
            onClick={action}
          >
            <Icon size={17} />
          </IconButton>
        ))}
        <span className="s-toolbar-divider" />
        <IconButton
          label="Undo"
          className="s-icon"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <IconArrowBackUp size={17} />
        </IconButton>
        <IconButton
          label="Redo"
          className="s-icon"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <IconArrowForwardUp size={17} />
        </IconButton>
        <Button className="s-save-action" onClick={flush}>
          <IconCheck size={13} />
          {dirty ? "Save now" : "Saved locally"}
        </Button>
      </div>
      <EditorContent editor={editor} />
      {draftError && (
        <p className="s-error" role="alert">
          Immediate draft recovery could not save. Keep this page open until the
          browser save succeeds, or copy your text.
        </p>
      )}
      <div className="s-editor-bottom">
        <span>
          {wordCount(html).toLocaleString()} words ·{" "}
          {Math.max(1, Math.ceil(wordCount(html) / 220))} min read
        </span>
        <span role="status">
          {dirty ? "Saving your words…" : "Your words are saved on this device"}
        </span>
      </div>
    </>
  );
}
export default function ManuscriptPage({ projectId }: { projectId: string }) {
  const { data, patch, insert, update, record, persistence } = useStudio();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(false);
  const [context, setContext] = useState(false);
  const [contextId, setContextId] = useState("");
  const [form, setForm] = useState<"chapter" | "scene" | "rename" | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const works = data.works.filter(
    (w) => w.projectId === projectId && w.kind !== "Comic",
  );
  const work = works.find((w) => w.id === params.get("work")) ?? works[0];
  const chapters = data.chapters
    .filter((c) => c.workId === work?.id)
    .sort((a, b) => a.position - b.position);
  const explicitScene = data.scenes.find(
    (s) =>
      s.id === params.get("scene") &&
      chapters.some((c) => c.id === s.chapterId),
  );
  const chapter =
    chapters.find(
      (c) => c.id === (explicitScene?.chapterId ?? params.get("chapter")),
    ) ?? chapters[0];
  const scenes = data.scenes.filter((s) => s.chapterId === chapter?.id);
  const scene = explicitScene ?? scenes[0];
  const entities = data.entities.filter((e) => e.projectId === projectId);
  const selectedEntity =
    entities.find((e) => e.id === contextId) ?? entities[0];
  useEffect(() => {
    if (!scene) return;
    update((d) =>
      d.lastSceneId === scene.id
        ? d
        : {
            ...d,
            lastSceneId: scene.id,
            activity: [
              {
                id: uid("activity"),
                projectId,
                label: `Revisited “${chapter?.title ?? scene.title}”`,
                href: `${projectPath(projectId, "manuscript")}?work=${work?.id ?? ""}&scene=${scene.id}`,
                at: new Date().toISOString(),
              },
              ...d.activity,
            ].slice(0, 100),
          },
    );
  }, [scene?.id, update]);
  useEffect(() => {
    const before = document.body.style.overflow;
    const chrome = [
      ...document.querySelectorAll<HTMLElement>(
        ".studio .s-sidebar, .studio .s-topbar",
      ),
    ];
    const original = chrome.map((element) => element.inert);
    if (focus) document.body.style.overflow = "hidden";
    if (focus) for (const element of chrome) element.inert = true;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = before;
      if (focus)
        chrome.forEach((element, index) => {
          element.inert = original[index];
        });
      document.removeEventListener("keydown", key);
    };
  }, [focus]);
  const openScene = (id: string) => {
    router.push(
      `${projectPath(projectId, "manuscript")}?work=${work.id}&scene=${id}`,
      { scroll: false },
    );
    setNavOpen(false);
  };
  if (!work)
    return (
      <EmptyState
        title="A page waiting for words"
        description="Create a prose work first. Comics have a separate visual planning workflow."
        action={
          <Link
            href={projectPath(projectId, "works")}
            className="s-button primary"
          >
            Open books & works
          </Link>
        }
      />
    );
  const chapterWords = (id: string) =>
    data.scenes
      .filter((s) => s.chapterId === id)
      .reduce((n, s) => n + wordCount(s.content), 0);
  const matches = query.trim()
    ? data.scenes.filter(
        (s) =>
          chapters.some((c) => c.id === s.chapterId) &&
          `${s.title} ${plainText(s.content)}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
    : [];
  return (
    <div
      className={`s-manuscript ${focus ? "focus" : ""} ${context ? "with-context" : ""}`}
    >
      <div className="s-manuscript-top">
        <div className="s-actions">
          <IconFeather size={18} />
          <label>
            <span className="s-sr">Choose a manuscript</span>
            <select
              value={work.id}
              onChange={(e) =>
                router.push(
                  `${projectPath(projectId, "manuscript")}?work=${e.target.value}`,
                )
              }
            >
              {works.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </label>
          <Badge>{work.kind}</Badge>
        </div>
        <div className="s-actions">
          <Button
            className="s-button quiet s-chapters-toggle"
            onClick={() => setNavOpen(!navOpen)}
          >
            Chapters
          </Button>
          <IconButton
            label={context ? "Hide reference panel" : "Show reference panel"}
            aria-pressed={context}
            className="s-icon"
            onClick={() => setContext(!context)}
          >
            <IconLayoutSidebarRight size={19} />
          </IconButton>
          <Button className="s-button quiet" onClick={() => setFocus(!focus)}>
            <IconFocus2 size={16} />
            {focus ? "Exit focus" : "Focus"}
          </Button>
        </div>
      </div>
      <div className="s-manuscript-layout">
        <aside
          className={`s-chapter-tree ${navOpen ? "open" : ""}`}
          aria-label="Chapters and scenes"
        >
          <div className="s-row">
            <p className="s-eyebrow">MANUSCRIPT</p>
            <IconButton
              label="Create chapter"
              className="s-icon"
              onClick={() => setForm("chapter")}
            >
              <IconPlus size={15} />
            </IconButton>
          </div>
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search manuscript"
            placeholder="Find in manuscript…"
          />
          {query ? (
            <div className="s-chapter-matches">
              <p className="s-meta">{matches.length} matching scenes</p>
              {matches.map((s) => (
                <Button key={s.id} onClick={() => openScene(s.id)}>
                  <strong>
                    {data.chapters.find((c) => c.id === s.chapterId)?.title}
                  </strong>
                  <small>{s.title}</small>
                </Button>
              ))}
            </div>
          ) : (
            chapters.map((c, n) => (
              <div
                className={`s-chapter-group ${c.id === chapter?.id ? "active" : ""}`}
                key={c.id}
              >
                <div className="s-row">
                  <Button
                    className="s-chapter-title"
                    onClick={() => {
                      const first = data.scenes.find(
                        (s) => s.chapterId === c.id,
                      );
                      if (first) openScene(first.id);
                    }}
                  >
                    <span>{String(n + 1).padStart(2, "0")}</span>
                    <strong>{c.title}</strong>
                  </Button>
                  <div className="s-chapter-order">
                    <IconButton
                      label={`Move ${c.title} up`}
                      disabled={n === 0}
                      className="s-icon"
                      onClick={() => update((d) => reorderChapter(d, c.id, -1))}
                    >
                      <IconArrowUp size={12} />
                    </IconButton>
                    <IconButton
                      label={`Move ${c.title} down`}
                      disabled={n === chapters.length - 1}
                      className="s-icon"
                      onClick={() => update((d) => reorderChapter(d, c.id, 1))}
                    >
                      <IconArrowDown size={12} />
                    </IconButton>
                  </div>
                </div>
                <small className="s-chapter-words">
                  {chapterWords(c.id).toLocaleString()} words
                </small>
                {c.id === chapter?.id && (
                  <div className="s-scene-list">
                    {data.scenes
                      .filter((s) => s.chapterId === c.id)
                      .map((s) => (
                        <Button
                          aria-current={s.id === scene?.id ? "page" : undefined}
                          key={s.id}
                          onClick={() => openScene(s.id)}
                        >
                          <span className="s-scene-dot" />
                          {s.title}
                        </Button>
                      ))}
                    <Button onClick={() => setForm("scene")}>
                      <IconPlus size={12} />
                      Add a scene
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
          <Button className="s-add-chapter" onClick={() => setForm("chapter")}>
            <IconPlus size={15} /> Add chapter
          </Button>
          <div className="s-manuscript-progress">
            <span className="s-meta">YOUR MANUSCRIPT</span>
            <p>
              {chapters
                .reduce((n, c) => n + chapterWords(c.id), 0)
                .toLocaleString()}{" "}
              words
            </p>
            <div className="s-progress-track">
              <span
                style={{
                  width: `${Math.min(100, chapters.reduce((n, c) => n + chapterWords(c.id), 0) / ((data.projects.find((p) => p.id === projectId)?.goal ?? 80000) / 100))}%`,
                }}
              />
            </div>
            <small className="s-meta">
              {(
                data.projects.find((p) => p.id === projectId)?.goal ?? 80000
              ).toLocaleString()}
              -word writing milestone
            </small>
          </div>
        </aside>
        <section className="s-writing-pane">
          {chapter && scene ? (
            <>
              <div className="s-writing-heading">
                <p className="s-eyebrow">
                  CHAPTER {String(chapter.position + 1).padStart(2, "0")}{" "}
                  <span className="s-dot">/</span> {scene.title}
                </p>
                <label>
                  <span className="s-sr">Chapter title</span>
                  <input
                    key={chapter.id}
                    className="s-chapter-title-input"
                    defaultValue={chapter.title}
                    onBlur={(e) => {
                      const title = e.target.value.trim();
                      if (title) patch("chapters", chapter.id, { title });
                      else e.target.value = chapter.title;
                    }}
                    maxLength={200}
                  />
                </label>
                <div className="s-row">
                  <span className="s-meta">
                    {data.projects.find((p) => p.id === projectId)?.title}
                  </span>
                  <Button
                    className="s-text-button"
                    onClick={() => setForm("rename")}
                  >
                    Rename scene
                  </Button>
                </div>
              </div>
              <RichWritingSurface
                key={scene.id}
                scene={scene}
                onSave={(content) => {
                  patch("scenes", scene.id, {
                    content,
                    updatedAt: new Date().toISOString(),
                  });
                  patch("works", work.id, {
                    updatedAt: new Date().toISOString(),
                  });
                  patch("projects", projectId, {
                    updatedAt: new Date().toISOString(),
                  });
                  record(
                    projectId,
                    `Wrote in “${chapter.title}”`,
                    `${projectPath(projectId, "manuscript")}?work=${work.id}&scene=${scene.id}`,
                  );
                }}
              />
              <p className="s-editor-storage" role="status">
                {persistence === "error"
                  ? "Browser save failed. Your text is still open; see the save warning above."
                  : "LOCAL DEMO · Your manuscript stays in this browser"}
              </p>
            </>
          ) : (
            <EmptyState
              title="Begin with a chapter"
              description="A title and a first sentence are enough."
              action={
                <Button
                  className="s-button primary"
                  onClick={() => setForm("chapter")}
                >
                  Create chapter
                </Button>
              }
            />
          )}
        </section>
        {context && (
          <aside className="s-reference-pane">
            <div className="s-row">
              <p className="s-eyebrow">BESIDE THE PAGE</p>
              <IconButton
                className="s-icon"
                label="Close reference panel"
                onClick={() => setContext(false)}
              >
                <IconX size={16} />
              </IconButton>
            </div>
            <label className="s-reference-select">
              <span>Reference entry</span>
              <select
                value={selectedEntity?.id ?? ""}
                onChange={(e) => setContextId(e.target.value)}
              >
                {entities.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.name} · {e.kind}
                  </option>
                ))}
              </select>
            </label>
            {selectedEntity ? (
              <>
                {selectedEntity.image && (
                  <img
                    src={selectedEntity.image}
                    alt={`${selectedEntity.name} visual study`}
                  />
                )}
                <Badge>{selectedEntity.kind}</Badge>
                <h2>{selectedEntity.name}</h2>
                <p>{selectedEntity.summary}</p>
                <div className="s-property-list">
                  {selectedEntity.properties.map((p) => (
                    <div key={p.id}>
                      <span>{p.label}</span>
                      {p.entityId ? (
                        <Button
                          className="s-entity-chip"
                          onClick={() => setContextId(p.entityId!)}
                        >
                          {p.value}
                        </Button>
                      ) : (
                        <strong>{p.value}</strong>
                      )}
                    </div>
                  ))}
                </div>
                <p className="s-reference-description">
                  {selectedEntity.description}
                </p>
                <Link
                  className="s-button quiet"
                  href={projectPath(projectId, `world/${selectedEntity.id}`)}
                >
                  Open full document <IconChevronRight size={14} />
                </Link>
              </>
            ) : (
              <p className="s-muted">
                Your project has no worldbuilding entries. You can keep writing
                without them.
              </p>
            )}
          </aside>
        )}
      </div>
      {form && (
        <FormDialog
          title={
            form === "chapter"
              ? "A new chapter"
              : form === "scene"
                ? "A new scene"
                : "Rename scene"
          }
          submitLabel={form === "rename" ? "Rename" : "Create"}
          fields={[
            {
              key: "title",
              label: "Title",
              required: true,
              value: form === "rename" ? scene?.title : "",
            },
          ]}
          onClose={() => setForm(null)}
          onSubmit={(v) => {
            if (form === "rename" && scene)
              patch("scenes", scene.id, { title: v.title.trim() });
            else if (form === "chapter") {
              const next = addChapter(data, work.id, v.title);
              update(() => next);
              const created = next.scenes.at(-1)!;
              openScene(created.id);
            } else if (chapter) {
              const id = uid("scene");
              insert("scenes", {
                id,
                chapterId: chapter.id,
                title: v.title.trim(),
                content: "<p></p>",
                updatedAt: new Date().toISOString(),
              });
              openScene(id);
            }
          }}
        />
      )}
    </div>
  );
}
