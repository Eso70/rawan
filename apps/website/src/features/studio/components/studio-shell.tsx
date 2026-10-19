"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  IconLayoutDashboard,
  IconBooks,
  IconHistory,
  IconSearch,
  IconSettings,
  IconHelpCircle,
  IconChevronDown,
  IconChevronRight,
  IconPlus,
  IconArrowLeft,
  IconFeather,
  IconWorld,
  IconTimeline,
  IconChartDots,
  IconLayoutBoard,
  IconNotes,
  IconPhoto,
  IconFileText,
  IconBook2,
  IconListTree,
  IconMenu2,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import { addProject, projectPath } from "../data/repository";
import type { WorkKind } from "../data/models";
import { Button, IconButton, FormDialog } from "./ui";
import { CommandPalette } from "./command-palette";

export const projectTools = [
  ["", "Overview", IconLayoutDashboard],
  ["works", "Books & works", IconBooks],
  ["manuscript", "Manuscript", IconFeather],
  ["world", "Worldbuilding", IconWorld],
  ["plot", "Plot & outline", IconListTree],
  ["timeline", "Timeline", IconTimeline],
  ["relationships", "Relationships", IconChartDots],
  ["canvas", "Creative canvas", IconLayoutBoard],
  ["research", "Research & notes", IconNotes],
  ["media", "Media & assets", IconPhoto],
] as const;
export function StudioShell({ children }: { children: ReactNode }) {
  const { data, ready, persistence, storageError, saveNow, update } =
    useStudio();
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/");
  const projectId = segments[2] === "projects" ? segments[3] : undefined;
  const project = data.projects.find((p) => p.id === projectId);
  const sidebar = useRef<HTMLElement>(null);
  const [mobile, setMobile] = useState(false);
  const [palette, setPalette] = useState(false);
  const [create, setCreate] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const change = () => setMobile(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!drawer || !mobile) return;
    const previous = document.activeElement;
    const get = () =>
      [
        ...(sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href],button:not(:disabled),select",
        ) ?? []),
      ].filter((e) => e.getClientRects().length);
    get()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawer(false);
        e.preventDefault();
      }
      if (e.key === "Tab") {
        const items = get();
        const first = items[0];
        const last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [drawer, mobile]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);
  useEffect(() => {
    const open = () => [
      ...document.querySelectorAll<HTMLDetailsElement>(
        ".studio .s-menu[open], .studio .s-graph-settings[open]",
      ),
    ];
    const pointer = (e: PointerEvent) => {
      for (const item of open())
        if (e.target instanceof Node && !item.contains(e.target))
          item.open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      for (const item of open()) {
        const inside = item.contains(document.activeElement);
        item.open = false;
        if (inside) item.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const activeTool = projectTools.find(
    ([slug]) => slug === (segments[4] ?? ""),
  );
  const nav = (
    href: string,
    label: string,
    Icon: typeof IconBooks,
    active: boolean,
  ) => (
    <Link
      key={href}
      href={href}
      className={`s-nav-link ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={18} stroke={1.6} />
      <span>{label}</span>
    </Link>
  );
  return (
    <div
      className="studio"
      data-theme={data.preferences.theme}
      data-motion={data.preferences.reducedMotion ? "reduced" : "system"}
      data-density={data.preferences.compact ? "compact" : "comfortable"}
      style={
        {
          "--editor-size": `${data.preferences.fontSize}px`,
          "--editor-leading": data.preferences.lineHeight,
          "--editor-width": `${data.preferences.editorWidth}px`,
          "--editor-family":
            data.preferences.font === "serif"
              ? '"Rawan Lora", Georgia, serif'
              : '"Rawan Inter", Arial, sans-serif',
        } as CSSProperties
      }
    >
      <a href="#studio-main" className="s-skip">
        Skip to your work
      </a>
      <aside
        ref={sidebar}
        inert={mobile && !drawer}
        role={mobile && drawer ? "dialog" : undefined}
        aria-modal={mobile && drawer ? true : undefined}
        className={`s-sidebar ${drawer ? "open" : ""}`}
        aria-label={project ? "Project navigation" : "Author navigation"}
      >
        <div className="s-brand-row">
          <Link href="/studio" className="s-brand">
            <img src="/brand/logo.svg" alt="" width={26} height={26} />
            <span>
              rawan<span className="s-brand-sub">AUTHOR STUDIO</span>
            </span>
          </Link>
          <IconButton
            label="Close navigation"
            className="s-icon s-mobile"
            onClick={() => setDrawer(false)}
          >
            <IconX size={20} />
          </IconButton>
        </div>
        <Button
          className="s-sidebar-search"
          data-tour="search"
          onClick={() => setPalette(true)}
        >
          <IconSearch size={16} />
          <span>Find anything</span>
          <kbd>⌘ K</kbd>
        </Button>
        {project ? (
          <>
            <Link href="/studio/projects" className="s-back">
              <IconArrowLeft size={14} /> All projects
            </Link>
            <label className="s-project-switch">
              <span className="s-sr">Switch project</span>
              <img src={project.cover} alt="" />
              <select
                value={project.id}
                onChange={(e) => router.push(projectPath(e.target.value))}
              >
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <IconChevronDown size={14} />
            </label>
            <p className="s-nav-label">YOUR WORKSPACE</p>
            <nav>
              {projectTools.map(([slug, label, Icon]) =>
                nav(
                  projectPath(project.id, slug),
                  label,
                  Icon,
                  slug === (segments[4] ?? ""),
                ),
              )}
            </nav>
            <div className="s-sidebar-bottom">
              {nav(
                projectPath(project.id, "settings"),
                "Project settings",
                IconSettings,
                segments[4] === "settings",
              )}
            </div>
          </>
        ) : (
          <>
            <nav>
              {nav(
                "/studio",
                "Your desk",
                IconLayoutDashboard,
                pathname === "/studio",
              )}
              {nav(
                "/studio/projects",
                "Projects",
                IconBooks,
                pathname === "/studio/projects",
              )}
              {nav(
                "/studio/activity",
                "Recent activity",
                IconHistory,
                pathname === "/studio/activity",
              )}
            </nav>
            <div className="s-nav-group">
              <p className="s-nav-label">PINNED PROJECTS</p>
              {data.projects
                .filter((p) => p.pinned)
                .map((p) => (
                  <Link
                    href={projectPath(p.id)}
                    className="s-pinned-link"
                    key={p.id}
                  >
                    <span style={{ background: p.color }} />
                    {p.title}
                  </Link>
                ))}
              <Button className="s-new-project" onClick={() => setCreate(true)}>
                <IconPlus size={15} /> New project
              </Button>
            </div>
            <div className="s-sidebar-note">
              <IconFeather size={22} stroke={1.2} />
              <p>
                A little space.
                <br />
                An entire world.
              </p>
            </div>
            <div className="s-sidebar-bottom">
              {nav(
                "/studio/preferences",
                "Preferences",
                IconSettings,
                pathname === "/studio/preferences",
              )}
              {nav(
                "/studio/help",
                "Help & inspiration",
                IconHelpCircle,
                pathname === "/studio/help",
              )}
            </div>
          </>
        )}
        {project && (
          <Link className="s-help-link" href="/studio/help">
            <IconHelpCircle size={17} /> Help & shortcuts
          </Link>
        )}
        <Link href="/reader" className="s-help-link">
          <IconBook2 size={17} /> Reader Experience
        </Link>
        <Link href="/studio/preferences" className="s-profile">
          <span className="s-avatar">
            {data.preferences.authorName.slice(0, 1) || "R"}
          </span>
          <span>
            <strong>{data.preferences.authorName || "Writer"}</strong>
            <small>Personal workspace</small>
          </span>
          <IconChevronDown size={14} />
        </Link>
      </aside>
      {drawer && (
        <Button
          className="s-drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}
      <div className="s-app-body" inert={mobile && drawer}>
        <header className="s-topbar">
          <div className="s-breadcrumb">
            <IconButton
              label="Open navigation"
              className="s-icon s-mobile"
              onClick={() => setDrawer(true)}
            >
              <IconMenu2 size={20} />
            </IconButton>
            <IconBook2 size={16} />
            <Link href="/studio">Author Studio</Link>
            <IconChevronRight size={13} />
            <span>
              {project?.title ??
                (pathname === "/studio"
                  ? "Your desk"
                  : segments[2]?.replace(/^./, (c) => c.toUpperCase()))}
            </span>
            {project && (
              <>
                <IconChevronRight size={13} />
                <span className="s-breadcrumb-tool">
                  {activeTool?.[1] ?? "Project settings"}
                </span>
              </>
            )}
          </div>
          <div className="s-topbar-right">
            <span className="s-demo-label">
              <span /> Local demo
            </span>
            <span className="s-save-small" title="Stored in this browser only">
              <IconCheck size={13} />
              {persistence === "saving"
                ? "Saving…"
                : persistence === "error"
                  ? "Not saved"
                  : "Saved on device"}
            </span>
            <Link
              href="/studio/activity"
              className="s-icon"
              aria-label="Recent activity"
            >
              <IconHistory size={18} />
            </Link>
            <Button
              className="s-icon"
              aria-label="Open command palette"
              onClick={() => setPalette(true)}
            >
              <IconSearch size={18} />
            </Button>
          </div>
        </header>
        {storageError && (
          <div className="s-storage-error" role="alert">
            {storageError}
            <Button onClick={saveNow}>Retry save</Button>
          </div>
        )}
        <main id="studio-main" className="s-main" tabIndex={-1}>
          {ready ? (
            children
          ) : (
            <div className="s-loading" role="status">
              <IconFileText size={30} />
              <p>Opening your studio…</p>
            </div>
          )}
        </main>
      </div>
      {palette && (
        <CommandPalette
          projectId={projectId}
          onClose={() => setPalette(false)}
          onCreate={() => setCreate(true)}
        />
      )}
      {create && (
        <FormDialog
          title="A new beginning"
          submitLabel="Create project"
          note="Your project and edits stay in this browser."
          onClose={() => setCreate(false)}
          fields={[
            { key: "title", label: "Project title", required: true },
            {
              key: "kind",
              label: "What are you creating?",
              type: "select",
              options: [
                "Novel",
                "Non-fiction",
                "Short story",
                "Essay",
                "Comic",
              ],
            },
            {
              key: "description",
              label: "A few words about it",
              type: "textarea",
            },
          ]}
          onSubmit={(v) => {
            const next = addProject(data, {
              title: v.title,
              description: v.description,
              kind: v.kind as WorkKind,
            });
            update(() => next);
            router.push(projectPath(next.projects.at(-1)!.id));
          }}
        />
      )}
    </div>
  );
}
