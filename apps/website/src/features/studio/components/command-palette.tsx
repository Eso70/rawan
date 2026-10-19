"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconCommand, IconSearch } from "@tabler/icons-react";
import { Modal, Button } from "./ui";
import { useStudio } from "../studio-provider";
import {
  addChapter,
  addEntity,
  projectPath,
  searchData,
} from "../data/repository";
export function CommandPalette({
  onClose,
  projectId,
  onCreate,
}: {
  onClose: () => void;
  projectId?: string;
  onCreate: () => void;
}) {
  const { data, update, notify } = useStudio();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const project =
    data.projects.find((p) => p.id === projectId) ?? data.projects[0];
  const commands = useMemo(
    () => [
      {
        id: "continue",
        title: "Continue writing",
        context: "Manuscript",
        run: () => {
          const scene = data.scenes.find((s) => s.id === data.lastSceneId);
          const chapter = data.chapters.find((c) => c.id === scene?.chapterId);
          const work = data.works.find((w) => w.id === chapter?.workId);
          router.push(
            work
              ? `${projectPath(work.projectId, "manuscript")}?work=${work.id}&scene=${scene?.id}`
              : "/studio/projects",
          );
        },
      },
      {
        id: "new-project",
        title: "Create a project",
        context: "New beginning",
        run: onCreate,
      },
      ...(project
        ? [
            {
              id: "new-chapter",
              title: "Create a chapter",
              context: project.title,
              run: () => {
                const work = data.works.find(
                  (w) => w.projectId === project.id && w.kind !== "Comic",
                );
                if (!work) {
                  notify("Create a prose work in Works first.");
                  router.push(projectPath(project.id, "works"));
                  return;
                }
                const next = addChapter(data, work.id, "Untitled chapter");
                update(() => next);
                const c = next.chapters.at(-1)!;
                router.push(
                  `${projectPath(project.id, "manuscript")}?work=${work.id}&chapter=${c.id}`,
                );
              },
            },
            {
              id: "new-character",
              title: "Create a character",
              context: project.title,
              run: () => {
                const next = addEntity(
                  data,
                  project.id,
                  "Character",
                  "Untitled character",
                );
                update(() => next);
                router.push(
                  projectPath(project.id, `world/${next.entities.at(-1)!.id}`),
                );
              },
            },
            ...["timeline", "canvas", "settings"].map((tool) => ({
              id: tool,
              title: `Open ${tool}`,
              context: project.title,
              run: () => router.push(projectPath(project.id, tool)),
            })),
          ]
        : []),
      {
        id: "preferences",
        title: "Preferences",
        context: "Make space for your work",
        run: () => router.push("/studio/preferences"),
      },
    ],
    [data, router, onCreate, project, notify, update],
  );
  const items = query
    ? [
        ...commands.filter((c) =>
          c.title.toLowerCase().includes(query.toLowerCase()),
        ),
        ...searchData(data, query)
          .slice(0, 15)
          .map((r) => ({
            ...r,
            run: () => {
              update((d) => ({
                ...d,
                recentSearches: [
                  query,
                  ...d.recentSearches.filter((v) => v !== query),
                ].slice(0, 6),
              }));
              router.push(r.href);
            },
          })),
      ]
    : commands;
  useEffect(() => {
    document
      .getElementById(`command-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const execute = (index: number) => {
    const item = items[index];
    if (item) {
      onClose();
      item.run();
    }
  };
  return (
    <Modal title="Find your next thought" onClose={onClose} wide>
      <div
        className="s-palette"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            execute(active);
          }
        }}
      >
        <label className="s-palette-input">
          <IconSearch size={20} />
          <span className="s-sr">
            Search projects, chapters, entries and commands
          </span>
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="studio-command-list"
            aria-activedescendant={
              items[active] ? `command-${active}` : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search your studio, or find a command…"
          />
        </label>
        <p className="s-eyebrow">
          {query ? "Results & commands" : "A few useful places"}
        </p>
        <div
          id="studio-command-list"
          role="listbox"
          aria-label="Commands and results"
          className="s-command-list"
        >
          {items.map((item, i) => (
            <Button
              key={item.id}
              id={`command-${i}`}
              role="option"
              aria-selected={active === i}
              className={active === i ? "active" : ""}
              onMouseMove={() => setActive(i)}
              onClick={() => execute(i)}
            >
              <IconCommand size={17} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.context}</small>
              </span>
              <IconArrowRight size={16} />
            </Button>
          ))}
          {!items.length && (
            <p className="s-empty">
              No matches. Try a project title or a character name.
            </p>
          )}
        </div>
        <footer>
          <span>↑ ↓ to explore</span>
          <span>↵ to open</span>
          <span>esc to close</span>
          <Link
            onClick={onClose}
            href={`/studio/search?q=${encodeURIComponent(query)}`}
          >
            Full search →
          </Link>
        </footer>
      </div>
    </Modal>
  );
}
