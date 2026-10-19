"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconPencil,
  IconTrash,
  IconArrowUpRight,
  IconFlag,
  IconClock,
  IconChevronRight,
} from "@tabler/icons-react";
import { SplitView } from "../components/split-view";
import type { PlotPoint, Status, TimelineEvent } from "../data/models";
import { useStudio } from "../studio-provider";
import { projectPath, uid } from "../data/repository";
import {
  PageHeading,
  Button,
  IconButton,
  CreateButton,
  FormDialog,
  ConfirmDialog,
  CollectionTools,
  StatusBadge,
  Badge,
  EmptyState,
  SectionHeading,
} from "../components/ui";
export function PlotPage({ projectId }: { projectId: string }) {
  const { data, insert, patch, update, remove } = useStudio();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [arcForm, setArcForm] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const arcs = data.arcs.filter((a) => a.projectId === projectId);
  const points = data.points.filter((p) => p.projectId === projectId);
  const editing = points.find((p) => p.id === selected);
  const chapters = data.chapters.filter((c) =>
    data.works.some((w) => w.id === c.workId && w.projectId === projectId),
  );
  const move = (p: PlotPoint, direction: number) => {
    const list = points
      .filter((v) => v.arcId === p.arcId)
      .sort((a, b) => a.position - b.position);
    const i = list.findIndex((v) => v.id === p.id);
    if (!list[i + direction]) return;
    [list[i], list[i + direction]] = [list[i + direction], list[i]];
    const map = new Map(list.map((v, n) => [v.id, n]));
    update((d) => ({
      ...d,
      points: d.points.map((v) =>
        map.has(v.id) ? { ...v, position: map.get(v.id)! } : v,
      ),
    }));
  };
  return (
    <>
      <PageHeading
        eyebrow="THE SHAPE OF THE STORY"
        title="Plot & outline"
        description="A structure to lean on. Room to find another way."
        actions={
          <CreateButton onClick={() => setSelected("new")}>
            New plot point
          </CreateButton>
        }
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <Badge>
          {points.filter((p) => p.status === "Complete").length} /{" "}
          {points.length} developed
        </Badge>
        <Button className="s-button quiet" onClick={() => setArcForm(true)}>
          <IconPlus size={14} />
          Add an act
        </Button>
      </CollectionTools>
      <div className="s-outline">
        {arcs.map((arc) => {
          const list = points
            .filter(
              (p) =>
                p.arcId === arc.id &&
                `${p.title} ${p.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .sort((a, b) => a.position - b.position);
          return (
            <details open className="s-arc" key={arc.id}>
              <summary>
                <IconChevronRight size={16} />
                <h2>{arc.title}</h2>
                <span>{list.length} plot points</span>
              </summary>
              <p className="s-muted">{arc.description}</p>
              <div className="s-outline-list">
                {list.map((p, n) => {
                  const c = data.chapters.find((c) => c.id === p.chapterId);
                  return (
                    <article className="s-outline-point" key={p.id}>
                      <span className="s-outline-number">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <Button
                          className="s-title-button"
                          onClick={() => setSelected(p.id)}
                        >
                          {p.title}
                        </Button>
                        <p>{p.description}</p>
                        <div className="s-actions">
                          <StatusBadge value={p.status} />
                          {c && (
                            <Link
                              href={`${projectPath(projectId, "manuscript")}?chapter=${c.id}&work=${c.workId}`}
                              className="s-meta"
                            >
                              {c.title}
                              <IconArrowUpRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="s-outline-actions">
                        <IconButton
                          label={`Move ${p.title} up`}
                          disabled={n === 0}
                          className="s-icon"
                          onClick={() => move(p, -1)}
                        >
                          <IconArrowUp size={14} />
                        </IconButton>
                        <IconButton
                          label={`Move ${p.title} down`}
                          disabled={n === list.length - 1}
                          className="s-icon"
                          onClick={() => move(p, 1)}
                        >
                          <IconArrowDown size={14} />
                        </IconButton>
                        <IconButton
                          label={`Edit ${p.title}`}
                          className="s-icon"
                          onClick={() => setSelected(p.id)}
                        >
                          <IconPencil size={14} />
                        </IconButton>
                        <IconButton
                          label={`Delete ${p.title}`}
                          className="s-icon"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <IconTrash size={14} />
                        </IconButton>
                      </div>
                    </article>
                  );
                })}
                {!list.length && (
                  <p className="s-empty-inline">
                    Leave room for an unexpected turn.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
      {!arcs.length && (
        <EmptyState
          title="Give the story a little shape"
          description="Begin with an act, then add the moments that matter."
          action={
            <CreateButton onClick={() => setArcForm(true)}>
              Create an act
            </CreateButton>
          }
        />
      )}
      {selected && (
        <FormDialog
          title={editing ? "Develop this moment" : "A new turning point"}
          onClose={() => setSelected(null)}
          fields={[
            {
              key: "title",
              label: "Title",
              required: true,
              value: editing?.title,
            },
            {
              key: "description",
              label: "What changes?",
              type: "textarea",
              value: editing?.description,
            },
            {
              key: "arc",
              label: "Act / arc",
              type: "select",
              required: true,
              value: arcs.find((a) => a.id === editing?.arcId)?.title,
              options: arcs.map((a) => a.title),
            },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Planning", "Drafting", "Revising", "Complete"],
              value: editing?.status,
            },
            {
              key: "chapter",
              label: "Connected chapter",
              type: "select",
              value:
                chapters.find((c) => c.id === editing?.chapterId)?.title ??
                "None",
              options: ["None", ...chapters.map((c) => c.title)],
            },
          ]}
          onSubmit={(v) => {
            const arc = arcs.find((a) => a.title === v.arc);
            if (!arc) throw new Error("Create an act first.");
            const value = {
              title: v.title.trim(),
              description: v.description,
              arcId: arc.id,
              status: v.status as Status,
              chapterId: chapters.find((c) => c.title === v.chapter)?.id ?? "",
            };
            if (editing) patch("points", editing.id, value);
            else
              insert("points", {
                ...value,
                id: uid("point"),
                projectId,
                position: points.filter((p) => p.arcId === arc.id).length,
              });
          }}
        />
      )}
      {arcForm && (
        <FormDialog
          title="Another part of the story"
          onClose={() => setArcForm(false)}
          fields={[
            { key: "title", label: "Act / arc title", required: true },
            { key: "description", label: "Purpose", type: "textarea" },
          ]}
          onSubmit={(v) =>
            insert("arcs", {
              id: uid("arc"),
              projectId,
              title: v.title.trim(),
              description: v.description,
            })
          }
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Remove this plot point?"
          description="The linked chapter stays in your manuscript."
          onClose={() => setDeleteId("")}
          onConfirm={() => remove("points", deleteId)}
        />
      )}
    </>
  );
}
export function TimelinePage({ projectId }: { projectId: string }) {
  const { data, insert, patch, remove } = useStudio();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [era, setEra] = useState("All eras");
  const [category, setCategory] = useState("All categories");
  const [density, setDensity] = useState("Comfortable");
  const [form, setForm] = useState<string | null>(null);
  const [eraForm, setEraForm] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const eras = data.eras.filter((e) => e.projectId === projectId);
  const all = data.events.filter((e) => e.projectId === projectId);
  const events = all
    .filter(
      (e) =>
        (era === "All eras" || era === e.eraId) &&
        (category === "All categories" || category === e.category) &&
        `${e.title} ${e.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.order - b.order);
  const selected =
    events.find((e) => e.id === params.get("event")) ?? events[0];
  const editing = all.find((e) => e.id === form);
  const entities = data.entities.filter((e) => e.projectId === projectId);
  return (
    <>
      <PageHeading
        eyebrow="MOMENTS AND CONSEQUENCES"
        title="Timeline"
        description="Not just what happened. What it made possible."
        actions={
          <CreateButton onClick={() => setForm("new")}>New event</CreateButton>
        }
      />
      <CollectionTools query={query} setQuery={setQuery}>
        <label>
          <span className="s-sr">Filter era</span>
          <select value={era} onChange={(e) => setEra(e.target.value)}>
            <option>All eras</option>
            {eras.map((e) => (
              <option value={e.id} key={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="s-sr">Filter event category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["All categories", ...new Set(all.map((e) => e.category))].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="s-sr">Timeline density</span>
          <select value={density} onChange={(e) => setDensity(e.target.value)}>
            <option>Comfortable</option>
            <option>Compact</option>
          </select>
        </label>
        <Button className="s-button quiet" onClick={() => setEraForm(true)}>
          Add era
        </Button>
      </CollectionTools>
      <p className="s-local-note">
        Relative story chronology · local ordering numbers, not a calendar
        engine
      </p>
      <div className="s-timeline-overview" aria-label="Timeline overview">
        {events.map((e) => (
          <Button
            key={e.id}
            className={e.id === selected?.id ? "active" : ""}
            onClick={() =>
              router.replace(
                `${projectPath(projectId, "timeline")}?event=${e.id}`,
                { scroll: false },
              )
            }
          >
            <span className="s-timeline-dot" />
            <small>{e.date}</small>
            <strong>{e.title}</strong>
          </Button>
        ))}
      </div>
      <SplitView
        className={`s-split-workspace ${density === "Compact" ? "compact" : ""}`}
      >
        <section aria-label="Event list">
          {eras
            .filter((e) => era === "All eras" || era === e.id)
            .map((e) => (
              <section key={e.id} className="s-era-section">
                <p className="s-eyebrow">{e.title}</p>
                {events
                  .filter((v) => v.eraId === e.id)
                  .map((event) => (
                    <Button
                      key={event.id}
                      className={`s-event-row ${selected?.id === event.id ? "active" : ""}`}
                      onClick={() =>
                        router.replace(
                          `${projectPath(projectId, "timeline")}?event=${event.id}`,
                          { scroll: false },
                        )
                      }
                    >
                      <IconClock size={16} />
                      <span>
                        <small>{event.date}</small>
                        <strong>{event.title}</strong>
                        <p>{event.description.slice(0, 115)}…</p>
                      </span>
                      <IconChevronRight size={14} />
                    </Button>
                  ))}
              </section>
            ))}
        </section>
        <aside className="s-detail-panel" aria-label="Event details">
          {selected ? (
            <>
              <Badge>{selected.category}</Badge>
              <h2>{selected.title}</h2>
              <p className="s-meta">
                {selected.date} ·{" "}
                {eras.find((e) => e.id === selected.eraId)?.title}
              </p>
              <p className="s-detail-description">{selected.description}</p>
              <div className="s-actions">
                <Button
                  className="s-button quiet"
                  onClick={() => setForm(selected.id)}
                >
                  <IconPencil size={14} />
                  Edit event
                </Button>
                <IconButton
                  className="s-icon"
                  label="Delete event"
                  onClick={() => setDeleteId(selected.id)}
                >
                  <IconTrash size={15} />
                </IconButton>
              </div>
              <SectionHeading title="People & places" />
              {selected.entityIds.map((id) => {
                const e = entities.find((e) => e.id === id);
                return e ? (
                  <Link
                    className="s-related-row"
                    href={projectPath(projectId, `world/${id}`)}
                    key={id}
                  >
                    <IconFlag size={15} />
                    <span>
                      <strong>{e.name}</strong>
                      <small>{e.kind}</small>
                    </span>
                    <IconArrowUpRight size={14} />
                  </Link>
                ) : null;
              })}
              {!selected.entityIds.length && (
                <p className="s-muted">No entries linked yet.</p>
              )}
            </>
          ) : (
            <p className="s-muted">No events match this view.</p>
          )}
        </aside>
      </SplitView>
      {!all.length && (
        <EmptyState
          title="A first moment in time"
          description="Create an era, then the events that give it meaning."
          action={
            <CreateButton
              onClick={() => (eras.length ? setForm("new") : setEraForm(true))}
            >
              Begin a timeline
            </CreateButton>
          }
        />
      )}
      {form && (
        <FormDialog
          title={editing ? "Edit event" : "A moment that matters"}
          onClose={() => setForm(null)}
          fields={[
            {
              key: "title",
              label: "Event title",
              required: true,
              value: editing?.title,
            },
            {
              key: "description",
              label: "What happened?",
              type: "textarea",
              value: editing?.description,
            },
            {
              key: "date",
              label: "Story date / relative label",
              value: editing?.date,
              required: true,
            },
            {
              key: "order",
              label: "Ordering number",
              type: "number",
              value: String(editing?.order ?? (all.length + 1) * 10),
              required: true,
            },
            {
              key: "era",
              label: "Era",
              type: "select",
              options: eras.map((e) => e.title),
              value: eras.find((e) => e.id === editing?.eraId)?.title,
              required: true,
            },
            {
              key: "category",
              label: "Category",
              value: editing?.category ?? "Story",
              required: true,
            },
            {
              key: "entity",
              label: "Related entry",
              type: "select",
              options: ["None", ...entities.map((e) => e.name)],
              value:
                entities.find((e) => e.id === editing?.entityIds[0])?.name ??
                "None",
            },
          ]}
          onSubmit={(v) => {
            const chosenEra = eras.find((e) => e.title === v.era);
            const order = Number(v.order);
            if (!chosenEra) throw new Error("Create an era first.");
            if (!Number.isFinite(order))
              throw new Error("Use a finite ordering number.");
            const target = entities.find((e) => e.name === v.entity);
            const value: Omit<TimelineEvent, "id" | "projectId"> = {
              title: v.title.trim(),
              description: v.description,
              date: v.date,
              order,
              category: v.category.trim(),
              eraId: chosenEra.id,
              entityIds: target
                ? [
                    target.id,
                    ...(editing?.entityIds.slice(1) ?? []).filter(
                      (id) => id !== target.id,
                    ),
                  ]
                : [],
            };
            if (editing) patch("events", editing.id, value);
            else {
              const id = uid("event");
              insert("events", { ...value, id, projectId });
              router.replace(
                `${projectPath(projectId, "timeline")}?event=${id}`,
              );
            }
          }}
        />
      )}
      {eraForm && (
        <FormDialog
          title="A new era"
          onClose={() => setEraForm(false)}
          fields={[
            { key: "title", label: "Era name", required: true },
            {
              key: "description",
              label: "What defines this period?",
              type: "textarea",
            },
          ]}
          onSubmit={(v) =>
            insert("eras", {
              id: uid("era"),
              projectId,
              title: v.title,
              description: v.description,
            })
          }
        />
      )}
      {deleteId && (
        <ConfirmDialog
          title="Remove this event?"
          description="Related worldbuilding entries will remain."
          onClose={() => setDeleteId("")}
          onConfirm={() => remove("events", deleteId)}
        />
      )}
    </>
  );
}
