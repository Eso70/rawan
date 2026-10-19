"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconPlus,
  IconTag,
  IconUser,
  IconMapPin,
  IconFlag,
  IconDiamond,
  IconLayoutGrid,
  IconList,
  IconPencil,
  IconTrash,
  IconPhoto,
  IconX,
  IconLink,
} from "@tabler/icons-react";
import type { EntityKind } from "../data/models";
import { useStudio } from "../studio-provider";
import { addEntity, projectPath, uid } from "../data/repository";
import {
  PageHeading,
  Button,
  IconButton,
  CreateButton,
  CollectionTools,
  EmptyState,
  FormDialog,
  Modal,
  ConfirmDialog,
  SectionHeading,
  dateLabel,
} from "../components/ui";
const kinds: EntityKind[] = ["Character", "Location", "Faction", "Artifact"];
const icons = {
  Character: IconUser,
  Location: IconMapPin,
  Faction: IconFlag,
  Artifact: IconDiamond,
};
export function WorldPage({ projectId }: { projectId: string }) {
  const { data, update } = useStudio();
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(params.get("kind") ?? "All entries");
  const [sort, setSort] = useState("Recently edited");
  const [list, setList] = useState(false);
  const [create, setCreate] = useState(params.get("create") === "1");
  const all = data.entities.filter((e) => e.projectId === projectId);
  const entities = all
    .filter(
      (e) =>
        (filter === "All entries" || e.kind === filter) &&
        `${e.name} ${e.summary} ${e.tags.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Name"
        ? a.name.localeCompare(b.name)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  return (
    <>
      <PageHeading
        eyebrow="THE WORLD BEHIND THE WORDS"
        title={
          filter === "All entries"
            ? "Worldbuilding"
            : `${filter === "Location" ? "Locations" : filter + "s"}`
        }
        description="People, places, and the details that make a world feel lived in."
        actions={
          <CreateButton onClick={() => setCreate(true)}>New entry</CreateButton>
        }
      />
      <div className="s-world-categories">
        <Button
          aria-pressed={filter === "All entries"}
          onClick={() => setFilter("All entries")}
        >
          <IconLayoutGrid size={20} />
          <span>
            All entries<small>{all.length} in your world</small>
          </span>
        </Button>
        {kinds.map((kind) => {
          const Icon = icons[kind];
          return (
            <Button
              key={kind}
              aria-pressed={filter === kind}
              onClick={() => {
                setFilter(kind);
                router.replace(
                  `${projectPath(projectId, "world")}?kind=${kind}`,
                  { scroll: false },
                );
              }}
            >
              <Icon size={21} stroke={1.4} />
              <span>
                {kind === "Location" ? "Locations" : `${kind}s`}
                <small>
                  {all.filter((e) => e.kind === kind).length} entries
                </small>
              </span>
            </Button>
          );
        })}
        <Link href={projectPath(projectId, "timeline")}>
          <IconFlag size={20} />
          <span>
            Events
            <small>
              {data.events.filter((e) => e.projectId === projectId).length}{" "}
              moments
            </small>
          </span>
        </Link>
      </div>
      <CollectionTools query={query} setQuery={setQuery}>
        <label className="s-sr" htmlFor="entity-sort">
          Sort entries
        </label>
        <select
          id="entity-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Recently edited</option>
          <option>Name</option>
        </select>
        <div className="s-segmented">
          <Button
            aria-label="Entity grid view"
            aria-pressed={!list}
            onClick={() => setList(false)}
          >
            <IconLayoutGrid size={17} />
          </Button>
          <Button
            aria-label="Entity list view"
            aria-pressed={list}
            onClick={() => setList(true)}
          >
            <IconList size={17} />
          </Button>
        </div>
      </CollectionTools>
      <p className="s-result-count">
        {entities.length} entries ·{" "}
        {filter === "All entries" ? "Your project's reference library" : filter}
      </p>
      <div className={`s-entity-grid ${list ? "list" : ""}`}>
        {entities.map((e) => {
          const Icon = icons[e.kind];
          return (
            <Link
              href={projectPath(projectId, `world/${e.id}`)}
              key={e.id}
              className="s-entity-card"
            >
              {e.image ? (
                <img src={e.image} alt="" />
              ) : (
                <div className="s-entity-placeholder">
                  <Icon size={34} stroke={1} />
                </div>
              )}
              <div>
                <span className="s-eyebrow">
                  <Icon size={12} />
                  {e.kind}
                </span>
                <h2>{e.name}</h2>
                <p>{e.summary || "A story still taking shape."}</p>
                <div className="s-row">
                  <span className="s-tags">
                    {e.tags.slice(0, 2).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </span>
                  <IconArrowUpRight size={15} />
                </div>
                <small>Edited {dateLabel(e.updatedAt)}</small>
              </div>
            </Link>
          );
        })}
      </div>
      {!entities.length && (
        <EmptyState
          title={
            all.length ? "No entries found" : "Not every story needs a world"
          }
          description={
            all.length
              ? "Try another name, tag or category."
              : "Add supporting people or places when they become useful. Writing and research can stand on their own."
          }
          action={
            <CreateButton onClick={() => setCreate(true)}>
              Create an entry
            </CreateButton>
          }
        />
      )}
      {create && (
        <FormDialog
          title="Something worth remembering"
          submitLabel="Create entry"
          onClose={() => setCreate(false)}
          fields={[
            { key: "name", label: "Name", required: true },
            {
              key: "kind",
              label: "Entry type",
              type: "select",
              options: kinds,
              value: filter === "All entries" ? "Character" : filter,
            },
            {
              key: "summary",
              label: "A sentence about them",
              type: "textarea",
            },
          ]}
          onSubmit={(v) => {
            const next = addEntity(
              data,
              projectId,
              v.kind as EntityKind,
              v.name,
            );
            const e = next.entities.at(-1)!;
            e.summary = v.summary;
            update(() => next);
            router.push(projectPath(projectId, `world/${e.id}`));
          }}
        />
      )}
    </>
  );
}
export function EntityPage({
  projectId,
  entityId,
}: {
  projectId: string;
  entityId: string;
}) {
  const { data, patch, remove, notify, record } = useStudio();
  const router = useRouter();
  const entity = data.entities.find(
    (e) => e.id === entityId && e.projectId === projectId,
  );
  const [edit, setEdit] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [smallForm, setSmallForm] = useState<
    "alias" | "tag" | "section" | null
  >(null);
  const [image, setImage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!entity)
    return (
      <EmptyState
        title="This entry is no longer here"
        description="It may have been removed from the local demo."
        action={
          <Link
            href={projectPath(projectId, "world")}
            className="s-button quiet"
          >
            Back to worldbuilding
          </Link>
        }
      />
    );
  const Icon = icons[entity.kind];
  const relations = data.relationships.filter(
    (r) => r.sourceId === entity.id || r.targetId === entity.id,
  );
  const linked = entity.properties.find((p) => p.id === propertyId);
  const media = data.media.filter((m) => m.projectId === projectId);
  const save = (values: Partial<typeof entity>) => {
    patch("entities", entity.id, {
      ...values,
      updatedAt: new Date().toISOString(),
    });
    record(
      projectId,
      `Updated “${entity.name}”`,
      projectPath(projectId, `world/${entity.id}`),
    );
  };
  return (
    <>
      <div className="s-document-top">
        <Link
          className="s-back"
          href={projectPath(projectId, `world?kind=${entity.kind}`)}
        >
          <IconArrowLeft size={14} />
          {entity.kind === "Location" ? "Locations" : `${entity.kind}s`}
        </Link>
        <div className="s-actions">
          <Button className="s-button quiet" onClick={() => setEdit(true)}>
            <IconPencil size={15} />
            Edit document
          </Button>
          <IconButton
            label={`Delete ${entity.name}`}
            className="s-icon"
            onClick={() => setDeleting(true)}
          >
            <IconTrash size={17} />
          </IconButton>
        </div>
      </div>
      <article className="s-entity-document">
        <header>
          <div>
            <p className="s-eyebrow">
              <Icon size={14} /> {entity.kind} <span className="s-dot">/</span>{" "}
              PRIVATE PROJECT REFERENCE
            </p>
            <h1>{entity.name}</h1>
            <p className="s-entity-lede">
              {entity.summary ||
                "A detail waiting to find its place in the story."}
            </p>
            <div className="s-aliases">
              <span>
                <IconTag size={13} /> Aliases
              </span>
              {entity.aliases.map((alias) => (
                <span className="s-removable-chip" key={alias}>
                  {alias}
                  <IconButton
                    label={`Remove alias ${alias}`}
                    onClick={() =>
                      save({
                        aliases: entity.aliases.filter((a) => a !== alias),
                      })
                    }
                  >
                    <IconX size={11} />
                  </IconButton>
                </span>
              ))}
              <Button
                className="s-dashed-chip"
                onClick={() => setSmallForm("alias")}
              >
                <IconPlus size={12} />
                Add alias
              </Button>
            </div>
            <div className="s-property-list">
              {entity.properties.map((p) => (
                <div key={p.id}>
                  <span>{p.label}</span>
                  {p.entityId ? (
                    <Link
                      className="s-entity-chip"
                      href={projectPath(projectId, `world/${p.entityId}`)}
                    >
                      <IconLink size={12} />
                      {data.entities.find((e) => e.id === p.entityId)?.name ??
                        "Unavailable reference"}
                    </Link>
                  ) : (
                    <strong>{p.value}</strong>
                  )}
                  <IconButton
                    label={`Edit ${p.label}`}
                    className="s-icon"
                    onClick={() => setPropertyId(p.id)}
                  >
                    <IconPencil size={13} />
                  </IconButton>
                  <IconButton
                    label={`Remove property ${p.label}`}
                    className="s-icon"
                    onClick={() =>
                      save({
                        properties: entity.properties.filter(
                          (v) => v.id !== p.id,
                        ),
                      })
                    }
                  >
                    <IconX size={13} />
                  </IconButton>
                </div>
              ))}
            </div>
            <Button
              className="s-text-button"
              onClick={() => setPropertyId("new")}
            >
              <IconPlus size={14} /> Add property
            </Button>
          </div>
          <Button
            className="s-entity-portrait"
            onClick={() => setImage(true)}
            aria-label={`Choose an image for ${entity.name}`}
          >
            {entity.image ? (
              <img
                src={entity.image}
                alt={`${entity.name}, original demonstration study`}
              />
            ) : (
              <IconPhoto size={32} stroke={1} />
            )}
            <span>
              <IconPhoto size={14} />
              {entity.image ? "Change image" : "Add image"}
            </span>
          </Button>
        </header>
        <section className="s-entity-description">
          <div className="s-section-heading">
            <h2>About</h2>
            <Button className="s-text-button" onClick={() => setEdit(true)}>
              Edit
            </Button>
          </div>
          {entity.description
            .split(/\n\n/)
            .filter(Boolean)
            .map((text, i) => (
              <p key={`${entity.id}-${i}`}>{text}</p>
            ))}
          {!entity.description && (
            <p className="s-muted">Begin with what matters to this story.</p>
          )}
          <Button
            className="s-text-button"
            onClick={() => setSmallForm("section")}
          >
            <IconPlus size={14} /> Add a content section
          </Button>
        </section>
        <div className="s-entity-document-bottom">
          <section>
            <SectionHeading title="Connected to this story" />
            {relations.length ? (
              relations.map((r) => {
                const other = data.entities.find(
                  (e) =>
                    e.id ===
                    (r.sourceId === entity.id ? r.targetId : r.sourceId),
                );
                return other ? (
                  <Link
                    className="s-related-row"
                    href={projectPath(projectId, `world/${other.id}`)}
                    key={r.id}
                  >
                    <IconLink size={15} />
                    <span>
                      <strong>{other.name}</strong>
                      <small>
                        {r.sourceId === entity.id
                          ? r.label
                          : `${r.label} · incoming reference`}
                      </small>
                    </span>
                    <IconArrowUpRight size={14} />
                  </Link>
                ) : null;
              })
            ) : (
              <Link
                className="s-button quiet"
                href={projectPath(projectId, "relationships")}
              >
                Explore relationships
              </Link>
            )}
          </section>
          <section>
            <SectionHeading title="Filed under" />
            <div className="s-tags">
              {entity.tags.map((tag) => (
                <span className="s-removable-chip" key={tag}>
                  {tag}
                  <IconButton
                    label={`Remove tag ${tag}`}
                    onClick={() =>
                      save({ tags: entity.tags.filter((t) => t !== tag) })
                    }
                  >
                    <IconX size={11} />
                  </IconButton>
                </span>
              ))}
              <Button
                className="s-dashed-chip"
                onClick={() => setSmallForm("tag")}
              >
                <IconPlus size={12} />
                Add tag
              </Button>
            </div>
            <p className="s-local-note">
              Aliases, custom properties and content sections are local
              prototype features. They do not add backend fields.
            </p>
          </section>
        </div>
      </article>
      {edit && (
        <FormDialog
          title="Edit document"
          onClose={() => setEdit(false)}
          fields={[
            { key: "name", label: "Name", value: entity.name, required: true },
            {
              key: "summary",
              label: "Summary",
              value: entity.summary,
              type: "textarea",
            },
            {
              key: "description",
              label: "Description",
              value: entity.description,
              type: "textarea",
            },
          ]}
          onSubmit={(v) => {
            save({
              name: v.name.trim(),
              summary: v.summary,
              description: v.description,
            });
            notify("Document updated locally.");
          }}
        />
      )}
      {propertyId && (
        <FormDialog
          title={linked ? "Edit property" : "Add a property"}
          note="Custom properties are stored in this demo only."
          onClose={() => setPropertyId(null)}
          fields={[
            {
              key: "label",
              label: "Property name",
              required: true,
              value: linked?.label,
            },
            { key: "value", label: "Value", value: linked?.value },
            {
              key: "reference",
              label: "Or link an entry",
              type: "select",
              value: data.entities.find((e) => e.id === linked?.entityId)
                ? `${data.entities.find((e) => e.id === linked?.entityId)!.name} · ${linked?.entityId}`
                : "None",
              options: [
                "None",
                ...data.entities
                  .filter(
                    (e) => e.projectId === projectId && e.id !== entity.id,
                  )
                  .map((e) => `${e.name} · ${e.id}`),
              ],
            },
          ]}
          onSubmit={(v) => {
            const target = data.entities.find(
              (e) =>
                `${e.name} · ${e.id}` === v.reference &&
                e.projectId === projectId,
            );
            const prop = {
              id: linked?.id ?? uid("property"),
              label: v.label.trim(),
              value: target?.name ?? v.value,
              entityId: target?.id,
            };
            save({
              properties: linked
                ? entity.properties.map((p) => (p.id === linked.id ? prop : p))
                : [...entity.properties, prop],
            });
          }}
        />
      )}
      {smallForm && (
        <FormDialog
          title={
            smallForm === "alias"
              ? "Another name"
              : smallForm === "tag"
                ? "Add a tag"
                : "Another part of the story"
          }
          fields={
            smallForm === "section"
              ? [
                  { key: "title", label: "Section title", required: true },
                  {
                    key: "body",
                    label: "Content",
                    type: "textarea",
                    required: true,
                  },
                ]
              : [
                  {
                    key: "value",
                    label: smallForm === "alias" ? "Alias" : "Tag",
                    required: true,
                  },
                ]
          }
          onClose={() => setSmallForm(null)}
          onSubmit={(v) =>
            smallForm === "section"
              ? save({
                  description:
                    `${entity.description}\n\n${v.title}\n${v.body}`.trim(),
                })
              : save(
                  smallForm === "alias"
                    ? {
                        aliases: [
                          ...new Set([...entity.aliases, v.value.trim()]),
                        ],
                      }
                    : { tags: [...new Set([...entity.tags, v.value.trim()])] },
                )
          }
        />
      )}
      {image && (
        <Modal
          title="An image for your entry"
          onClose={() => setImage(false)}
          wide
        >
          <div className="s-media-picker">
            {media.map((m) => (
              <Button
                key={m.id}
                onClick={() => {
                  save({ image: m.src });
                  setImage(false);
                }}
              >
                <img src={m.src} alt={m.title} />
                <span>{m.title}</span>
              </Button>
            ))}
          </div>
          <div className="s-dialog-actions">
            <Button
              className="s-button quiet"
              onClick={() => {
                save({ image: "" });
                setImage(false);
              }}
            >
              Remove image
            </Button>
            <Link
              href={projectPath(projectId, "media")}
              className="s-button quiet"
            >
              Open media library
            </Link>
          </div>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={`Remove ${entity.name}?`}
          description="This removes the entry and its local relationship links. It does not affect other projects."
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            remove("entities", entity.id);
            router.push(projectPath(projectId, "world"));
          }}
        />
      )}
    </>
  );
}
