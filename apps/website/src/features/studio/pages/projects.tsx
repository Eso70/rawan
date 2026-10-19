"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IconArrowUpRight,
  IconLayoutGrid,
  IconList,
  IconFeather,
  IconArrowRight,
  IconPlus,
} from "@tabler/icons-react";
import { useStudio } from "../studio-provider";
import {
  addChapter,
  addProject,
  plainText,
  projectPath,
  uid,
  workWords,
} from "../data/repository";
import type { WorkKind, Status } from "../data/models";
import { GuidedTour } from "../components/guided-tour";
import { ProjectCard } from "../components/project-card";
import {
  PageHeading,
  SectionHeading,
  CreateButton,
  Button,
  FormDialog,
  Badge,
  EmptyState,
  CollectionTools,
  StatusBadge,
  dateLabel,
} from "../components/ui";
export function ProjectsPage() {
  const { data, update } = useStudio();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All types");
  const [sort, setSort] = useState("Last edited");
  const [list, setList] = useState(false);
  const [create, setCreate] = useState(params.get("create") === "1");
  const filtered = data.projects
    .filter(
      (p) =>
        `${p.title} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (kind === "All types" || p.kind === kind),
    )
    .sort((a, b) =>
      sort === "Title"
        ? a.title.localeCompare(b.title)
        : sort === "Pinned first"
          ? Number(b.pinned) - Number(a.pinned)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <>
      <PageHeading
        eyebrow="A home for every idea"
        title="Your projects"
        description="Stories taking shape. Worlds waiting to be written."
        actions={
          <CreateButton onClick={() => setCreate(true)}>
            New project
          </CreateButton>
        }
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label className="s-sr" htmlFor="project-type">
          Filter project type
        </label>
        <select
          id="project-type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {[
            "All types",
            "Novel",
            "Non-fiction",
            "Short story",
            "Essay",
            "Comic",
          ].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <label className="s-sr" htmlFor="project-sort">
          Sort projects
        </label>
        <select
          id="project-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {["Last edited", "Title", "Pinned first"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="s-segmented">
          <Button
            aria-label="Grid view"
            aria-pressed={!list}
            onClick={() => setList(false)}
          >
            <IconLayoutGrid size={18} />
          </Button>
          <Button
            aria-label="List view"
            aria-pressed={list}
            onClick={() => setList(true)}
          >
            <IconList size={18} />
          </Button>
        </div>
      </CollectionTools>
      <p className="s-result-count">
        {filtered.length} projects · your personal collection
      </p>
      <div className={list ? "s-project-list" : "s-project-grid"}>
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} list={list} />
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="Make room for a new idea"
          description={
            query
              ? "No projects match these filters."
              : "Your first project can be a few words, a question, or an entire world."
          }
          action={
            <CreateButton onClick={() => setCreate(true)}>
              Create a project
            </CreateButton>
          }
        />
      )}
      {create && (
        <FormDialog
          title="A new beginning"
          submitLabel="Create project"
          onClose={() => setCreate(false)}
          fields={[
            { key: "title", label: "Project title", required: true },
            {
              key: "kind",
              label: "Type",
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
              label: "The idea, in a few words",
              type: "textarea",
            },
          ]}
          onSubmit={(v) => {
            const next = addProject(data, {
              title: v.title,
              kind: v.kind as WorkKind,
              description: v.description,
            });
            update(() => next);
            router.push(projectPath(next.projects.at(-1)!.id));
          }}
        />
      )}
    </>
  );
}
export function DashboardPage() {
  const { data, update } = useStudio();
  const params = useSearchParams();
  const router = useRouter();
  const [recentFilter, setRecentFilter] = useState("All projects");
  const scene =
    data.scenes.find((s) => s.id === data.lastSceneId) ?? data.scenes[0];
  const chapter = data.chapters.find((c) => c.id === scene?.chapterId);
  const work = data.works.find((w) => w.id === chapter?.workId);
  const project = data.projects.find((p) => p.id === work?.projectId);
  const continueHref =
    project && work
      ? `${projectPath(project.id, "manuscript")}?work=${work.id}&scene=${scene?.id}`
      : "/studio/projects";
  const totalWords = data.scenes.reduce(
    (n, s) => n + plainText(s.content).split(/\s+/).filter(Boolean).length,
    0,
  );
  return (
    <div className="s-dashboard">
      <PageHeading
        eyebrow="YOUR SPACE TO CREATE"
        title={`Back to the page, ${data.preferences.authorName || "writer"}.`}
        description="A quiet place for the work only you can make."
        actions={
          <Link href="/studio/projects?create=1" className="s-button quiet">
            <IconPlus size={16} /> New project
          </Link>
        }
      />
      <div className="s-desk-columns">
        <div>
          <section className="s-continue" data-tour="continue">
            <div className="s-continue-copy">
              <p className="s-eyebrow">
                <span className="s-live-dot" /> PICK UP WHERE YOU LEFT OFF
              </p>
              <span className="s-meta">
                {work?.title ?? "Your next story"}{" "}
                <span className="s-dot">/</span>{" "}
                {chapter
                  ? `Chapter ${chapter.position + 1}`
                  : "A new beginning"}
              </span>
              <h2>{chapter?.title ?? "Every story begins somewhere."}</h2>
              <p className="s-prose-excerpt">
                {scene
                  ? plainText(scene.content).slice(0, 185) + "…"
                  : "Make a little room for the first sentence. The rest can follow."}
              </p>
              <Link href={continueHref} className="s-button primary">
                <IconFeather size={17} /> Continue writing{" "}
                <IconArrowRight size={16} />
              </Link>
              <span className="s-meta s-continue-meta">
                {scene
                  ? `${workWords(data, work?.id ?? "").toLocaleString()} words in this work`
                  : "Create your first project"}
              </span>
            </div>
            <div className="s-continue-art">
              <img src={project?.cover ?? "/studio/covers/1.svg"} alt="" />
            </div>
          </section>
          <section className="s-dashboard-projects" data-tour="projects">
            <SectionHeading title="On your desk" href="/studio/projects" />
            <div className="s-project-grid desk">
              {data.projects.slice(0, 3).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
          <section className="s-recent-section">
            <SectionHeading
              title="Recently opened"
              action={
                <label>
                  <span className="s-sr">Filter recent work</span>
                  <select
                    value={recentFilter}
                    onChange={(e) => setRecentFilter(e.target.value)}
                  >
                    <option>All projects</option>
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
              }
            />
            <div className="s-document-list">
              {data.activity
                .filter(
                  (a) =>
                    recentFilter === "All projects" ||
                    a.projectId === recentFilter,
                )
                .slice(0, 4)
                .map((a) => (
                  <Link key={a.id} href={a.href}>
                    <span className="s-document-icon">
                      <IconFeather size={18} />
                    </span>
                    <span>
                      <strong>{a.label.replace("Revisited ", "")}</strong>
                      <small>
                        {data.projects.find((p) => p.id === a.projectId)?.title}
                      </small>
                    </span>
                    <span className="s-meta">{dateLabel(a.at)}</span>
                    <IconArrowUpRight size={16} />
                  </Link>
                ))}
            </div>
          </section>
        </div>
        <aside className="s-desk-aside">
          <section>
            <p className="s-eyebrow">THE WRITING LIFE</p>
            <h2>A little, every day.</h2>
            <p className="s-muted">Your ideas are becoming pages.</p>
            <div className="s-word-total">
              {totalWords.toLocaleString()}
              <span>words across your manuscripts</span>
            </div>
            <div className="s-progress-track">
              <span style={{ width: `${Math.min(100, totalWords / 400)}%` }} />
            </div>
            <p className="s-meta">Toward a 40,000-word demo milestone</p>
            <div className="s-small-stats">
              <span>
                <strong>{data.chapters.length}</strong>chapters
              </span>
              <span>
                <strong>{data.works.length}</strong>works
              </span>
              <span>
                <strong>{data.projects.length}</strong>projects
              </span>
            </div>
          </section>
          <section>
            <SectionHeading title="Small beginnings" />
            <div className="s-quick-create">
              <Link href="/studio/projects?create=1">
                <IconPlus size={17} />
                <span>Start a project</span>
                <IconArrowUpRight size={14} />
              </Link>
              <Link
                href={
                  data.projects[0]
                    ? projectPath(data.projects[0].id, "world?create=1")
                    : "/studio/projects?create=1"
                }
              >
                <IconPlus size={17} />
                <span>Meet a character</span>
                <IconArrowUpRight size={14} />
              </Link>
              <Link
                href={
                  data.projects[0]
                    ? projectPath(data.projects[0].id, "research?create=1")
                    : "/studio/projects?create=1"
                }
              >
                <IconPlus size={17} />
                <span>Capture a thought</span>
                <IconArrowUpRight size={14} />
              </Link>
            </div>
          </section>
          <section>
            <SectionHeading title="Recent activity" href="/studio/activity" />
            <div className="s-activity-mini">
              {data.activity.slice(0, 3).map((a) => (
                <Link href={a.href} key={a.id}>
                  <span className="s-activity-mark" />
                  <div>
                    <p>{a.label}</p>
                    <small>{dateLabel(a.at)}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <blockquote>
            “The secret is to begin.”<span>A note for your desk</span>
          </blockquote>
        </aside>
      </div>
      <footer className="s-desk-footer">
        <span>
          <IconFeather size={15} /> Made for the work, and the world behind it.
        </span>
        <Link href="/studio?tour=1" data-tour="tour-help">
          Take a little tour <IconArrowRight size={14} />
        </Link>
      </footer>
      {params.get("tour") === "1" && (
        <GuidedTour
          onClose={() => router.replace("/studio", { scroll: false })}
          onFinish={() => {
            update((d) => ({ ...d, tourCompleted: true }));
            router.replace("/studio", { scroll: false });
          }}
        />
      )}
    </div>
  );
}
export function ProjectOverview({ projectId }: { projectId: string }) {
  const { data } = useStudio();
  const project = data.projects.find((p) => p.id === projectId)!;
  const works = data.works.filter((w) => w.projectId === projectId);
  const entities = data.entities.filter((e) => e.projectId === projectId);
  const notes = data.notes.filter((n) => n.projectId === projectId);
  const points = data.points.filter((p) => p.projectId === projectId);
  const first = works.find((w) => w.kind !== "Comic");
  return (
    <>
      <PageHeading
        eyebrow="PROJECT OVERVIEW"
        title={project.title}
        actions={
          <Link
            className="s-button primary"
            href={projectPath(
              projectId,
              first ? `manuscript?work=${first.id}` : "works",
            )}
          >
            <IconFeather size={16} />
            {first ? "Open manuscript" : "Open works"}
          </Link>
        }
      />
      <section className="s-project-identity">
        <img src={project.cover} alt={`${project.title} cover`} />
        <div>
          <Badge>{project.kind}</Badge>
          <h2>Every detail belongs to the story.</h2>
          <p>{project.description}</p>
          <StatusBadge value={project.status} />
        </div>
        <div className="s-overview-counts">
          <span>
            <strong>{works.length}</strong>works in progress
          </span>
          <span>
            <strong>{entities.length}</strong>worldbuilding entries
          </span>
          <span>
            <strong>
              {data.events.filter((e) => e.projectId === projectId).length}
            </strong>
            moments in time
          </span>
        </div>
      </section>
      <div className="s-overview-grid">
        <section>
          <SectionHeading
            title="Your manuscripts"
            href={projectPath(projectId, "works")}
          />
          <div className="s-document-list">
            {works.map((w) => (
              <Link
                key={w.id}
                href={projectPath(
                  projectId,
                  w.kind === "Comic"
                    ? `works?work=${w.id}`
                    : `manuscript?work=${w.id}`,
                )}
              >
                <IconFeather size={20} />
                <span>
                  <strong>{w.title}</strong>
                  <small>
                    {w.kind} · {workWords(data, w.id).toLocaleString()} words
                  </small>
                </span>
                <IconArrowUpRight size={17} />
              </Link>
            ))}
          </div>
          <SectionHeading
            title="Research on the desk"
            href={projectPath(projectId, "research")}
          />
          {notes.slice(0, 2).map((n) => (
            <Link
              className="s-note-preview"
              key={n.id}
              href={projectPath(projectId, `research?note=${n.id}`)}
            >
              <span className="s-eyebrow">{n.folder}</span>
              <h3>{n.title}</h3>
              <p>{n.content.slice(0, 140)}…</p>
            </Link>
          ))}
        </section>
        <section>
          <SectionHeading
            title="The world behind the words"
            href={projectPath(projectId, "world")}
          />
          {entities.length ? (
            <div className="s-entity-mini-list">
              {entities.slice(0, 3).map((e) => (
                <Link href={projectPath(projectId, `world/${e.id}`)} key={e.id}>
                  <img src={e.image} alt="" />
                  <span>
                    <strong>{e.name}</strong>
                    <small>{e.kind}</small>
                  </span>
                  <IconArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="s-muted">
              Worldbuilding is optional. This project can stay focused on its
              writing and research.
            </p>
          )}
          <SectionHeading
            title="An outline taking shape"
            href={projectPath(projectId, "plot")}
          />
          <p className="s-muted">
            {points.filter((p) => p.status === "Complete").length} of{" "}
            {points.length} plot points developed
          </p>
          <div className="s-progress-track">
            <span
              style={{
                width: `${points.length ? (points.filter((p) => p.status === "Complete").length / points.length) * 100 : 0}%`,
              }}
            />
          </div>
          <SectionHeading
            title="In time"
            href={projectPath(projectId, "timeline")}
          />
          {data.events
            .filter((e) => e.projectId === projectId)
            .slice(-2)
            .map((e) => (
              <Link
                className="s-timeline-mini"
                key={e.id}
                href={projectPath(projectId, `timeline?event=${e.id}`)}
              >
                <small>{e.date}</small>
                <strong>{e.title}</strong>
              </Link>
            ))}
        </section>
      </div>
    </>
  );
}
export function WorksPage({ projectId }: { projectId: string }) {
  const { data, insert, patch, update } = useStudio();
  const router = useRouter();
  const [create, setCreate] = useState(false);
  const [editId, setEditId] = useState("");
  const [query, setQuery] = useState("");
  const works = data.works.filter(
    (w) =>
      w.projectId === projectId &&
      w.title.toLowerCase().includes(query.toLowerCase()),
  );
  const editing = data.works.find((w) => w.id === editId);
  const fields = [
    {
      key: "title",
      label: "Work title",
      required: true,
      value: editing?.title,
    },
    {
      key: "kind",
      label: "Form",
      type: "select" as const,
      options: ["Novel", "Non-fiction", "Short story", "Essay", "Comic"],
      value: editing?.kind,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea" as const,
      value: editing?.description,
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: ["Planning", "Drafting", "Revising", "Complete"],
      value: editing?.status,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="THE WORK ITSELF"
        title="Books & works"
        description="Give each story the space and form it needs."
        actions={
          <CreateButton onClick={() => setCreate(true)}>New work</CreateButton>
        }
      />
      <CollectionTools query={query} setQuery={setQuery} />
      <div className="s-work-list">
        {works.map((w) => (
          <article className="s-work-row" key={w.id}>
            <img src={w.cover} alt="" />
            <div>
              <Badge>{w.kind}</Badge>
              <h2>{w.title}</h2>
              <p>{w.description}</p>
              <div className="s-actions">
                <StatusBadge value={w.status} />
                <span className="s-meta">
                  {w.kind === "Comic"
                    ? "Artwork & script concept"
                    : `${workWords(data, w.id).toLocaleString()} words`}{" "}
                  · Edited {dateLabel(w.updatedAt)}
                </span>
              </div>
              {w.kind === "Comic" && (
                <p className="s-meta">
                  Future preview: dedicated comic editing is outside this
                  prototype. Use Media and Canvas to develop the concept.
                </p>
              )}
            </div>
            <div className="s-stack">
              <Link
                className="s-button primary"
                href={projectPath(
                  projectId,
                  w.kind === "Comic" ? "canvas" : `manuscript?work=${w.id}`,
                )}
              >
                {w.kind === "Comic" ? "Plan visually" : "Open manuscript"}
                <IconArrowRight size={15} />
              </Link>
              <Button
                className="s-button quiet"
                onClick={() => setEditId(w.id)}
              >
                Edit details
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!works.length && (
        <EmptyState
          title="A work of your own"
          description="Create a novel, an essay, a short story, or a visual concept."
          action={
            <CreateButton onClick={() => setCreate(true)}>
              Create work
            </CreateButton>
          }
        />
      )}
      {(create || editing) && (
        <FormDialog
          title={editing ? "Edit work" : "A new work"}
          fields={fields}
          onClose={() => {
            setCreate(false);
            setEditId("");
          }}
          onSubmit={(v) => {
            if (editing) {
              patch("works", editing.id, {
                title: v.title.trim(),
                description: v.description,
                kind: v.kind as WorkKind,
                status: v.status as Status,
              });
              return;
            }
            const id = uid("work");
            const work = {
              id,
              projectId,
              title: v.title.trim(),
              description: v.description,
              kind: v.kind as WorkKind,
              status: v.status as Status,
              cover: data.projects.find((p) => p.id === projectId)!.cover,
              updatedAt: new Date().toISOString(),
            };
            if (work.kind === "Comic") insert("works", work);
            else
              update((d) =>
                addChapter(
                  { ...d, works: [...d.works, work] },
                  id,
                  "The beginning",
                ),
              );
            router.push(
              projectPath(
                projectId,
                work.kind === "Comic" ? "canvas" : `manuscript?work=${id}`,
              ),
            );
          }}
        />
      )}
    </>
  );
}
