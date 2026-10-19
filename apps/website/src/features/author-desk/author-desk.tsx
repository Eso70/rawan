"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  IconBook2,
  IconLayoutBoard,
  IconUser,
  IconListTree,
  IconNotes,
  IconMapPin,
  IconChevronDown,
  IconPlus,
  IconSearch,
  IconFileText,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconFeather,
  IconX,
  IconArrowLeft,
  IconCheck,
  IconAdjustmentsHorizontal,
  IconLayoutGrid,
  IconSettings,
  IconFolderPlus,
  IconClock,
} from "@tabler/icons-react";
import {
  DESK_KEY,
  documentKinds,
  readDocuments,
  type DeskDocument,
  type DocumentKind,
} from "./documents";
import styles from "./author-desk.module.css";
import { backgroundIdFromResponse, studioBackgrounds } from "./backgrounds";
import { StudioHelp } from "./studio-help";
import { CreateDocument } from "./create-document";

const tools = [
  { kind: "Book", Icon: IconBook2 },
  { kind: "Comic", Icon: IconLayoutBoard },
  { kind: "Character", Icon: IconUser },
  { kind: "Outline", Icon: IconListTree },
  { kind: "Note", Icon: IconNotes },
  { kind: "Place", Icon: IconMapPin },
] as const;

const prompts: Record<DocumentKind, string> = {
  Book: "Every story begins with a first line…",
  Comic: "Page 1\n\nPanel 1 — Describe the scene, action, and dialogue…",
  Character:
    "Who are they?\n\nTheir story, appearance, motivations, and relationships…",
  Outline:
    "Where does your story begin?\n\nPlan your chapters, scenes, or story beats…",
  Note: "A thought, a detail, a little inspiration…",
  Place: "Describe this place, its atmosphere, and the stories it holds…",
};

export function AuthorDesk() {
  const reducedMotion = useReducedMotion();
  const [documents, setDocuments] = useState<DeskDocument[]>([]);
  const [ready, setReady] = useState(false);
  const [storageIssue, setStorageIssue] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DocumentKind | "All">("All");
  const [collapsed, setCollapsed] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [modal, setModal] = useState<"create" | "settings" | null>(null);
  const brandButton = useRef<HTMLButtonElement>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);
  const [saveState, setSaveState] = useState("Saved on this device");
  const [notice, setNotice] = useState("");
  const [more, setMore] = useState(false);
  const [localTime, setLocalTime] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  const writingScreen = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const active = documents.find((item) => item.id === selected);

  useEffect(() => {
    const updateClock = () => setLocalTime(new Intl.DateTimeFormat(undefined, {
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date()));
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    const refresh = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch("/api/studio/background", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const id = backgroundIdFromResponse(await response.json());
        if (!stopped && id) setBackground(id);
      } catch {
        /* Artwork is optional; an API outage never blocks writing. */
      } finally {
        clearTimeout(timeout);
        if (!stopped)
          timer = setTimeout(() => {
            void refresh();
          }, 300000);
      }
    };
    void refresh();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, []);

  useEffect(() => {
    const scene = studioBackgrounds.find((item) => item.id === background);
    if (!scene) {
      setBackgroundSrc(null);
      return;
    }
    let active = true;
    const image = new window.Image();
    image.onload = () => {
      if (active) setBackgroundSrc(scene.src);
    };
    image.onerror = () => {
      // Keep the previous background if an optional image cannot load.
    };
    image.src = scene.src;
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [background]);

  useEffect(() => {
    try {
      setDocuments(readDocuments(localStorage.getItem(DESK_KEY)));
    } catch {
      setStorageIssue(
        "Your saved drafts could not be opened. They have been kept on this device.",
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || storageIssue) return;
    setSaveState("Saving…");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DESK_KEY, JSON.stringify(documents));
        setSaveState("Saved on this device");
      } catch {
        setSaveState("Could not save on this device");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [documents, ready, storageIssue]);

  useEffect(() => {
    const popup = dialog.current;
    if (!popup) return;
    if (!modal) {
      popup.hidePopover();
      return;
    }
    const position = () => {
      const bounds = writingScreen.current?.getBoundingClientRect();
      const left = (bounds?.left ?? 0) + 6;
      const top = (bounds?.top ?? 0) + 46;
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.maxWidth = `${Math.max(0, window.innerWidth - left - 12)}px`;
      popup.style.maxHeight = `${Math.max(0, window.innerHeight - top - 12)}px`;
    };
    position();
    popup.showPopover();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [modal]);

  useEffect(() => {
    if (selected) titleInput.current?.focus();
  }, [selected]);

  useEffect(() => {
    if (!navigationOpen || modal) return;
    const closeNavigation = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (document.querySelector("#studio-help:popover-open")) return;
      setNavigationOpen(false);
      brandButton.current?.focus();
    };
    window.addEventListener("keydown", closeNavigation);
    return () => window.removeEventListener("keydown", closeNavigation);
  }, [navigationOpen, modal]);

  const create = (kind: DocumentKind, text = "", title = "") => {
    if (!ready || storageIssue) {
      setNotice(
        storageIssue || "Your writing space is opening. Please try again.",
      );
      return;
    }
    if (documents.length >= 100) {
      setNotice("This device's writing space holds up to 100 documents.");
      return;
    }
    const document: DeskDocument = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kind,
      title: title.slice(0, 100),
      text,
      role: "",
    };
    setDocuments((current) => [...current, document]);
    setSelected(document.id);
    setModal(null);
    setMore(false);
    setFilter("All");
    setSearch("");
  };

  const edit = (
    patch: Partial<Pick<DeskDocument, "title" | "text" | "role">>,
  ) => {
    setDocuments((current) =>
      current.map((item) =>
        item.id === selected ? { ...item, ...patch } : item,
      ),
    );
  };

  const importText = async (file?: File) => {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name) || file.size > 800000) {
      setNotice("Choose a .txt or .md file smaller than 800 KB.");
      return;
    }
    try {
      const text = await file.text();
      if (text.length > 200000) {
        setNotice("Choose a text file with fewer than 200,000 characters.");
        return;
      }
      create("Book", text, file.name.replace(/\.(txt|md)$/i, ""));
    } catch {
      setNotice("This file could not be opened. Please try another text file.");
    }
  };

  const visible = documents.filter(
    (item) =>
      (filter === "All" || item.kind === filter) &&
      `${item.title} ${item.kind} ${item.text}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <MotionConfig transition={{ duration: reducedMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}>
    <div className={`${styles.desk} ${collapsed ? styles.collapsed : ""} ${navigationOpen ? styles.navigationOpen : ""}`}>
      <a className={styles.skip} href="#author-workspace">
        Skip to writing space
      </a>
      <motion.button
        ref={brandButton}
        initial={false}
        animate={{ x: navigationOpen ? 1 : 0 }}
        className={styles.brand}
        aria-label="Rawan navigation"
        aria-expanded={navigationOpen}
        aria-controls="rawan-navigation"
        title={navigationOpen ? "Close Rawan navigation" : "Open Rawan navigation"}
        onClick={() => setNavigationOpen((open) => !open)}
      >
        <img src="/brand/logo.svg" width="19" height="19" alt="" />
      </motion.button>
      <motion.nav
        initial={false}
        animate={{ x: navigationOpen ? 0 : -54, opacity: navigationOpen ? 1 : 0 }}
        id="rawan-navigation"
        className={styles.navigation}
        aria-label="Rawan"
        aria-hidden={!navigationOpen}
        inert={!navigationOpen}
      >
        <button title="Your documents" aria-label="Your documents" onClick={() => setCollapsed(false)}>
          <IconLayoutGrid size={19} stroke={1.6} />
        </button>
        <a href="/account" className={styles.accountIcon} title="Your account" aria-label="Your account">
          <IconUser size={17} />
        </a>
        <span className={styles.navigationDivider} />
        <button className={styles.currentStudio} title="Author Studio" aria-label="Author Studio" aria-current="page" onClick={() => setSelected(null)}>
          <IconFeather size={22} stroke={1.6} />
        </button>
        <button className={styles.navigationCreate} title="New document" aria-label="New document" onClick={() => setModal("create")}>
          <IconPlus size={19} stroke={1.5} />
        </button>
        <div className={styles.navigationBottom}>
          <a href="/" title="Back to Rawan" aria-label="Back to Rawan"><IconArrowLeft size={19} /></a>
          <button title="Studio settings" aria-label="Studio settings" onClick={() => setModal("settings")}><IconSettings size={19} stroke={1.6} /></button>
        </div>
      </motion.nav>
      <motion.section
        ref={writingScreen}
        initial={false}
        animate={{
          left: navigationOpen ? 54 : 0,
          top: navigationOpen ? 2 : 0,
          right: navigationOpen ? 4 : 0,
          bottom: navigationOpen ? 5 : 0,
          borderRadius: navigationOpen ? 20 : 0,
          borderColor: navigationOpen ? "#cbdbe52b" : "#cbdbe500",
        }}
        className={styles.writingScreen}
        aria-label="Writing dashboard"
      >
        <div className={styles.atmosphere} aria-hidden="true" />
        {backgroundSrc && (
          <div
            className={styles.backgroundPhoto}
            style={{
              backgroundImage: `linear-gradient(#071a2b66, #06162599), url("${backgroundSrc}")`,
            }}
            aria-hidden="true"
          />
        )}
        <div className={styles.atmosphereShade} aria-hidden="true" />
      <motion.header initial={false} animate={{ paddingLeft: navigationOpen ? 0 : 46, top: navigationOpen ? 5 : 7 }} className={styles.rail}>
        <button
          className={styles.project}
          onClick={() => {
            setSelected(null);
            setModal("create");
          }}
        >
          <span className={styles.projectMark}>
            <IconBook2 size={16} />
          </span>{" "}
          My writing <IconChevronDown size={12} />
        </button>
        <button
          className={styles.workspaceTab}
          onClick={() => setSelected(null)}
        >
          <IconFeather size={15} /> Author Studio
        </button>
        <button
          className={styles.tab}
          aria-label="Open writing space"
          onClick={() => setSelected(null)}
        >
          <IconFeather size={17} />
        </button>
        <button
          className={styles.newDocumentTab}
          onClick={() => setModal("create")}
        >
          <IconFileText size={14} /> New document
        </button>
        <button
          className={styles.addTab}
          aria-label="Create a document"
          onClick={() => setModal("create")}
        >
          <IconPlus size={17} />
        </button>
        {active && (
          <span className={styles.save} role="status">
            <IconCheck size={13} /> {saveState}
          </span>
        )}
        <div className={styles.utilities}>
          <button popoverTarget="studio-help">Help</button>
          <IconClock size={13} aria-hidden="true" />
          <time aria-label="Local time">{localTime}</time>
        </div>
      </motion.header>

      <aside
        className={styles.sidebar}
        aria-label={collapsed ? "Collapsed writing navigation" : "Your writing"}
      >
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 1 : 0, x: collapsed ? 0 : -4 }}
          className={styles.collapsedRail}
          aria-hidden={!collapsed}
          inert={!collapsed}
        >
          <button
            title="Show documents"
            aria-label="Show documents"
            onClick={() => setCollapsed(false)}
          >
            <IconLayoutSidebarLeftExpand size={17} />
          </button>
          <button
            className={styles.railCreate}
            title="New document"
            aria-label="New document"
            onClick={() => setModal("create")}
          >
            <IconPlus size={18} stroke={1.5} />
          </button>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1, x: collapsed ? -8 : 0 }}
          className={styles.sidebarContent}
          aria-hidden={collapsed}
          inert={collapsed}
        >
          <div className={styles.sidebarTop}>
            <div className={styles.search}>
              <IconSearch size={15} />
              <input
                ref={searchInput}
                aria-label="Search documents"
                placeholder="Search documents…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className={styles.filterButton} title="Filter documents">
                <IconAdjustmentsHorizontal size={14} />
                <select
                  aria-label="Filter documents"
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as typeof filter)
                  }
                >
                  <option>All</option>
                  {documentKinds.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </span>
            </div>
            <button
              title="New document"
              aria-label="New document"
              onClick={() => setModal("create")}
            >
              <IconFolderPlus size={16} stroke={1.6} />
            </button>
            <button
              title="Hide documents"
              aria-label="Hide documents"
              onClick={() => setCollapsed(true)}
            >
              <IconLayoutSidebarLeftCollapse size={16} />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <IconFileText size={23} stroke={1.6} />
              </span>
              <p>No documents yet.</p>
              <button
                className={styles.newButton}
                onClick={() => setModal("create")}
              >
                <IconPlus size={14} /> New document
              </button>
              <button
                className={styles.importButton}
                onClick={() => fileInput.current?.click()}
              >
                Import your writing
              </button>
            </div>
          ) : (
            <nav className={styles.documentList} aria-label="Documents">
              {visible.length === 0 && (
                <p className={styles.noResults}>No matching documents.</p>
              )}
              {visible.map((item) => {
                const Icon = tools.find(
                  (tool) => tool.kind === item.kind,
                )!.Icon;
                return (
                  <button
                    key={item.id}
                    className={
                      selected === item.id ? styles.activeDocument : ""
                    }
                    onClick={() => setSelected(item.id)}
                  >
                    <Icon size={15} />
                    <span>
                      {item.title || `Untitled ${item.kind.toLowerCase()}`}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className={styles.sidebarFoot}>
            {tools.slice(0, 5).map(({ kind, Icon }) => (
              <button
                key={kind}
                title={`New ${kind.toLowerCase()}`}
                aria-label={`New ${kind.toLowerCase()}`}
                onClick={() => create(kind)}
              >
                <Icon size={17} stroke={1.6} />
              </button>
            ))}
            <button
              title="More documents"
              aria-label="More documents"
              onClick={() => setModal("create")}
            >
              <IconChevronDown size={16} />
            </button>
          </div>
        </motion.div>
      </aside>

      <main className={styles.workspace} id="author-workspace">
        {!active ? (
          <section className={styles.launcher} aria-label="Author tools">
            <p className={styles.intro}>A space for your stories</p>
            <div className={styles.path}>
              <span>
                <IconFeather size={15} />
              </span>{" "}
              Author Studio
            </div>
            <div className={styles.tools}>
              {tools.slice(0, 4).map(({ kind, Icon }) => (
                <button
                  className={styles.tool}
                  key={kind}
                  onClick={() => create(kind)}
                >
                  <span className={styles.toolTile}>
                    <Icon size={25} stroke={1.8} />
                  </span>
                  <span>{kind}</span>
                </button>
              ))}
              <div className={styles.moreWrap}>
                <button
                  className={`${styles.tool} ${styles.moreTool}`}
                  aria-expanded={more}
                  onClick={() => setMore(!more)}
                >
                  <span className={styles.toolTile}>
                    <IconChevronDown size={25} stroke={2} />
                  </span>
                  <span>More</span>
                </button>
                {more && (
                  <div className={styles.moreMenu}>
                    {tools.slice(4).map(({ kind, Icon }) => (
                      <button key={kind} onClick={() => create(kind)}>
                        <Icon size={16} />
                        {kind}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              className={styles.explore}
              onClick={() => setModal("create")}
            >
              <IconFeather size={15} /> Start creating
            </button>
          </section>
        ) : (
          <section
            className={styles.editor}
            aria-label={`${active.kind} editor`}
          >
            <div className={styles.editorRail}>
              <button
                aria-label="Back to writing space"
                title="Back to writing space"
                onClick={() => setSelected(null)}
              >
                <IconArrowLeft size={17} />
              </button>
              <span>{active.kind}</span>
              <button
                className={styles.closeEditor}
                aria-label="Close document"
                onClick={() => setSelected(null)}
              >
                <IconX size={17} />
              </button>
            </div>
            <div className={styles.paper}>
              <input
                className={styles.title}
                ref={titleInput}
                aria-label={
                  active.kind === "Character"
                    ? "Character name"
                    : "Document title"
                }
                placeholder={
                  active.kind === "Character"
                    ? "Character name"
                    : `Untitled ${active.kind.toLowerCase()}`
                }
                value={active.title}
                maxLength={100}
                onChange={(event) => edit({ title: event.target.value })}
              />
              {active.kind === "Character" && (
                <label className={styles.characterRole}>
                  Role{" "}
                  <input
                    placeholder="Their part in the story"
                    value={active.role}
                    maxLength={200}
                    onChange={(event) => edit({ role: event.target.value })}
                  />
                </label>
              )}
              <textarea
                className={styles.prose}
                aria-label={`${active.kind} content`}
                value={active.text}
                placeholder={prompts[active.kind]}
                maxLength={200000}
                onChange={(event) => edit({ text: event.target.value })}
              />
            </div>
          </section>
        )}
      </main>

      <StudioHelp />
      {(notice || storageIssue) && (
        <div className={styles.notice} role="status">
          {notice || storageIssue}
          <button
            aria-label="Dismiss notice"
            onClick={() => setNotice("")}
            hidden={!notice}
          >
            <IconX size={15} />
          </button>
        </div>
      )}
      <input
        type="file"
        hidden
        ref={fileInput}
        accept=".txt,.md,text/plain,text/markdown"
        onChange={(event) => {
          void importText(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <div
        ref={dialog}
        popover="auto"
        role="dialog"
        aria-labelledby="creation-popup-title"
        className={`${styles.dialog} ${modal === "create" ? styles.creationDialog : ""}`}
        onToggle={(event) => {
          if (event.newState === "closed") setModal(null);
        }}
      >
        <div className={styles.dialogHeading}>
          <h2 id="creation-popup-title">
            {modal === "settings" ? "Studio settings" : "What are you creating?"}
          </h2>
          <button aria-label="Close" onClick={() => setModal(null)}>
            <IconX size={18} />
          </button>
        </div>
        {modal === "settings" ? (
          <div className={styles.helpContent}>
            <p>Your drafts save automatically on this device.</p>
            <p>Backgrounds change automatically with the time and season. Animations follow your device’s reduced-motion setting.</p>
          </div>
        ) : modal === "create" ? (
          <CreateDocument
            onCreate={create}
            disabled={!ready || !!storageIssue}
            onImport={() => {
              setModal(null);
              fileInput.current?.click();
            }}
          />
        ) : null}
      </div>
      </motion.section>
    </div>
    </MotionConfig>
  );
}
