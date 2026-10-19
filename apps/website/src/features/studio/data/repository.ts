import type {
  StudioData,
  Row,
  Table,
  SearchResult,
  WorkKind,
  EntityKind,
} from "./models.ts";
import { createSeed } from "./seed.ts";

export const STORAGE_KEY = "rawan-author-studio-v1";
export const DRAFT_KEY = "rawan-author-studio-draft:";
export const uid = (prefix: string) =>
  `${prefix}-${globalThis.crypto.randomUUID()}`;
export const projectPath = (id: string, tool = "") =>
  `/studio/projects/${encodeURIComponent(id)}${tool ? `/${tool}` : ""}`;
export function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function wordCount(html: string) {
  const text = plainText(html);
  return text ? text.split(/\s+/u).length : 0;
}
export function workWords(data: StudioData, workId: string) {
  const ids = new Set(
    data.chapters.filter((c) => c.workId === workId).map((c) => c.id),
  );
  return data.scenes
    .filter((s) => ids.has(s.chapterId))
    .reduce((sum, s) => sum + wordCount(s.content), 0);
}
export function patchRow<K extends Table>(
  data: StudioData,
  table: K,
  id: string,
  patch: Partial<Omit<Row<K>, "id">>,
): StudioData {
  return {
    ...data,
    [table]: (data[table] as Row<K>[]).map((row) =>
      row.id === id ? { ...row, ...patch, id: row.id } : row,
    ),
  };
}
export function insertRow<K extends Table>(
  data: StudioData,
  table: K,
  row: Row<K>,
): StudioData {
  if ((data[table] as Row<K>[]).some((r) => r.id === row.id))
    throw new Error("That item already exists.");
  return { ...data, [table]: [...data[table], row] };
}
export function deleteRow(
  data: StudioData,
  table: Table,
  id: string,
): StudioData {
  let next = {
    ...data,
    [table]: (data[table] as { id: string }[]).filter((row) => row.id !== id),
  };
  if (table === "projects") {
    const works = new Set(
      data.works.filter((w) => w.projectId === id).map((w) => w.id),
    );
    const chapters = new Set(
      data.chapters.filter((c) => works.has(c.workId)).map((c) => c.id),
    );
    next = {
      ...next,
      works: data.works.filter((w) => !works.has(w.id)),
      chapters: data.chapters.filter((c) => !chapters.has(c.id)),
      scenes: data.scenes.filter((s) => !chapters.has(s.chapterId)),
    };
    const scoped = [
      "entities",
      "eras",
      "events",
      "relationships",
      "arcs",
      "points",
      "notes",
      "media",
      "nodes",
      "edges",
      "activity",
    ] as const;
    for (const key of scoped)
      next = {
        ...next,
        [key]: data[key].filter((row) => row.projectId !== id),
      };
  }
  if (table === "entities") {
    next = {
      ...next,
      relationships: data.relationships.filter(
        (r) => r.sourceId !== id && r.targetId !== id,
      ),
      events: data.events.map((e) => ({
        ...e,
        entityIds: e.entityIds.filter((v) => v !== id),
      })),
      notes: data.notes.map((n) => ({
        ...n,
        entityIds: n.entityIds.filter((v) => v !== id),
      })),
      entities: next.entities.map((e) => ({
        ...e,
        properties: e.properties.map((p) =>
          p.entityId === id
            ? { ...p, value: "Unavailable reference", entityId: undefined }
            : p,
        ),
      })),
      nodes: next.nodes.map((n) =>
        n.referenceId === id
          ? {
              ...n,
              kind: "note",
              referenceId: undefined,
              text: "The linked entry was removed.",
            }
          : n,
      ),
    };
  }
  if (table === "nodes")
    next.edges = data.edges.filter((e) => e.source !== id && e.target !== id);
  if (table === "media") {
    const media = data.media.find((m) => m.id === id);
    const src = media?.src;
    if (src)
      next = {
        ...next,
        entities: next.entities.map((e) =>
          e.projectId === media?.projectId && e.image === src
            ? { ...e, image: "" }
            : e,
        ),
        nodes: next.nodes.map((n) =>
          n.projectId === media?.projectId && n.image === src
            ? { ...n, image: undefined }
            : n,
        ),
      };
  }
  if (table === "chapters") {
    next.scenes = data.scenes.filter((s) => s.chapterId !== id);
    next.points = data.points.map((p) =>
      p.chapterId === id ? { ...p, chapterId: "" } : p,
    );
  }
  if (!next.scenes.some((s) => s.id === next.lastSceneId))
    next.lastSceneId = next.scenes[0]?.id ?? "";
  return next;
}
export function addProject(
  data: StudioData,
  input: { title: string; description: string; kind: WorkKind },
  id = uid("project"),
  at = new Date().toISOString(),
): StudioData {
  const title = input.title.trim();
  if (!title || title.length > 200)
    throw new Error("Use a project title between 1 and 200 characters.");
  return insertRow(data, "projects", {
    id,
    title,
    description: input.description.trim(),
    kind: input.kind,
    status: "Planning",
    cover: "/studio/covers/1.svg",
    color: "#bda373",
    pinned: false,
    updatedAt: at,
    goal: 80000,
  });
}
export function addChapter(
  data: StudioData,
  workId: string,
  title: string,
  id = uid("chapter"),
): StudioData {
  if (!data.works.some((w) => w.id === workId && w.kind !== "Comic"))
    throw new Error("Choose a prose work first.");
  if (!title.trim()) throw new Error("Give your chapter a title.");
  const next = insertRow(data, "chapters", {
    id,
    workId,
    title: title.trim(),
    position: data.chapters.filter((c) => c.workId === workId).length,
    status: "Drafting",
  });
  return insertRow(next, "scenes", {
    id: `${id}-opening`,
    chapterId: id,
    title: "Opening",
    content: "<p></p>",
    updatedAt: new Date().toISOString(),
  });
}
export function addEntity(
  data: StudioData,
  projectId: string,
  kind: EntityKind,
  name: string,
  id = uid("entity"),
): StudioData {
  if (!data.projects.some((p) => p.id === projectId) || !name.trim())
    throw new Error("Choose a project and give the entry a name.");
  return insertRow(data, "entities", {
    id,
    projectId,
    kind,
    name: name.trim(),
    summary: "",
    description: "",
    aliases: [],
    tags: [],
    properties: [],
    image: "",
    updatedAt: new Date().toISOString(),
  });
}
export function reorderChapter(
  data: StudioData,
  id: string,
  direction: -1 | 1,
): StudioData {
  const chapter = data.chapters.find((c) => c.id === id);
  if (!chapter) return data;
  const list = data.chapters
    .filter((c) => c.workId === chapter.workId)
    .sort((a, b) => a.position - b.position);
  const index = list.findIndex((c) => c.id === id);
  const swap = list[index + direction];
  if (!swap) return data;
  [list[index], list[index + direction]] = [swap, chapter];
  const positions = new Map(list.map((c, n) => [c.id, n]));
  return {
    ...data,
    chapters: data.chapters.map((c) =>
      positions.has(c.id) ? { ...c, position: positions.get(c.id)! } : c,
    ),
  };
}
export function searchData(
  data: StudioData,
  query: string,
  projectId?: string,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const projects = data.projects.filter(
    (p) => !projectId || p.id === projectId,
  );
  const ids = new Set(projects.map((p) => p.id));
  const projectTitle = (id: string) =>
    data.projects.find((p) => p.id === id)?.title ?? "";
  const results: SearchResult[] = [];
  const push = (row: SearchResult, text: string) => {
    if (`${row.title} ${text}`.toLowerCase().includes(q)) results.push(row);
  };
  projects.forEach((p) =>
    push(
      {
        id: p.id,
        title: p.title,
        kind: "Projects",
        context: p.kind,
        href: projectPath(p.id),
      },
      p.description,
    ),
  );
  data.works
    .filter((w) => ids.has(w.projectId))
    .forEach((w) =>
      push(
        {
          id: w.id,
          title: w.title,
          kind: "Works",
          context: projectTitle(w.projectId),
          href: projectPath(w.projectId, `works?work=${w.id}`),
        },
        w.description,
      ),
    );
  data.chapters.forEach((c) => {
    const w = data.works.find((w) => w.id === c.workId);
    if (w && ids.has(w.projectId))
      push(
        {
          id: c.id,
          title: c.title,
          kind: "Chapters",
          context: w.title,
          href: projectPath(
            w.projectId,
            `manuscript?work=${w.id}&chapter=${c.id}`,
          ),
        },
        data.scenes
          .filter((s) => s.chapterId === c.id)
          .map((s) => plainText(s.content))
          .join(" "),
      );
  });
  data.entities
    .filter((e) => ids.has(e.projectId))
    .forEach((e) =>
      push(
        {
          id: e.id,
          title: e.name,
          kind: e.kind === "Location" ? "Locations" : `${e.kind}s`,
          context: projectTitle(e.projectId),
          href: projectPath(e.projectId, `world/${e.id}`),
        },
        `${e.summary} ${e.description} ${e.aliases.join(" ")}`,
      ),
    );
  data.events
    .filter((e) => ids.has(e.projectId))
    .forEach((e) =>
      push(
        {
          id: e.id,
          title: e.title,
          kind: "Events",
          context: projectTitle(e.projectId),
          href: projectPath(e.projectId, `timeline?event=${e.id}`),
        },
        e.description,
      ),
    );
  data.notes
    .filter((n) => ids.has(n.projectId))
    .forEach((n) =>
      push(
        {
          id: n.id,
          title: n.title,
          kind: "Notes",
          context: projectTitle(n.projectId),
          href: projectPath(n.projectId, `research?note=${n.id}`),
        },
        `${n.content} ${n.tags.join(" ")}`,
      ),
    );
  return results.slice(0, 80);
}
export function encodeData(data: StudioData) {
  return JSON.stringify(data);
}
export function restoreSceneDrafts(
  data: StudioData,
  read: (key: string) => string | null,
): StudioData {
  return {
    ...data,
    scenes: data.scenes.map((scene) => {
      try {
        const raw = read(DRAFT_KEY + scene.id);
        if (!raw || raw.length > 1_000_000) return scene;
        const value: unknown = JSON.parse(raw);
        if (
          value &&
          typeof value === "object" &&
          typeof (value as { content?: unknown }).content === "string" &&
          typeof (value as { at?: unknown }).at === "string"
        ) {
          const draft = value as { content: string; at: string };
          if (draft.at > scene.updatedAt)
            return { ...scene, content: draft.content, updatedAt: draft.at };
        }
      } catch {
        /* A corrupt recovery draft must not block the studio. */
      }
      return scene;
    }),
  };
}
export function decodeData(raw: string | null): StudioData | null {
  if (!raw || raw.length > 12_000_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    const seed = createSeed();
    if (v.version !== 1) return null;
    for (const key of Object.keys(seed) as (keyof StudioData)[]) {
      if (Array.isArray(seed[key])) {
        if (!Array.isArray(v[key]) || (v[key] as unknown[]).length > 10000)
          return null;
        const list = v[key] as unknown[];
        if (key === "recentSearches") {
          if (!list.every((r) => typeof r === "string")) return null;
        } else if (
          !list.every(
            (r) =>
              !!r &&
              typeof r === "object" &&
              typeof (r as { id?: unknown }).id === "string",
          )
        )
          return null;
      }
    }
    const p = v.preferences as Record<string, unknown> | undefined;
    if (
      !p ||
      !["dark", "light"].includes(String(p.theme)) ||
      !["serif", "sans"].includes(String(p.font)) ||
      typeof p.fontSize !== "number" ||
      p.fontSize < 14 ||
      p.fontSize > 28 ||
      typeof p.lineHeight !== "number" ||
      p.lineHeight < 1.3 ||
      p.lineHeight > 2.4 ||
      typeof p.editorWidth !== "number" ||
      p.editorWidth < 480 ||
      p.editorWidth > 1000 ||
      typeof p.authorName !== "string" ||
      typeof p.compact !== "boolean" ||
      typeof p.reducedMotion !== "boolean" ||
      typeof v.lastSceneId !== "string" ||
      typeof v.tourCompleted !== "boolean"
    )
      return null;
    // Validate row shapes against seed exemplars before feature components consume them.
    for (const key of Object.keys(seed) as (keyof StudioData)[]) {
      const template = seed[key];
      if (
        !Array.isArray(template) ||
        key === "recentSearches" ||
        !template.length
      )
        continue;
      const example = template[0] as unknown as Record<string, unknown>;
      for (const row of v[key] as Record<string, unknown>[]) {
        for (const [field, sample] of Object.entries(example)) {
          if (
            ["referenceId", "image"].includes(field) &&
            row[field] === undefined
          )
            continue;
          if (
            Array.isArray(sample)
              ? !Array.isArray(row[field])
              : typeof row[field] !== typeof sample
          )
            return null;
        }
      }
    }
    const strings = (input: unknown): input is string[] =>
      Array.isArray(input) && input.every((item) => typeof item === "string");
    for (const key of Object.keys(seed) as (keyof StudioData)[]) {
      if (!Array.isArray(seed[key]) || key === "recentSearches") continue;
      const rows = v[key] as Record<string, unknown>[];
      if (new Set(rows.map((row) => row.id)).size !== rows.length) return null;
    }
    for (const entity of v.entities as Record<string, unknown>[]) {
      if (
        !strings(entity.tags) ||
        !strings(entity.aliases) ||
        !["Character", "Location", "Faction", "Artifact"].includes(
          String(entity.kind),
        )
      )
        return null;
      for (const prop of entity.properties as unknown[]) {
        if (!prop || typeof prop !== "object") return null;
        const value = prop as Record<string, unknown>;
        if (
          !["id", "label", "value"].every(
            (key) => typeof value[key] === "string",
          ) ||
          (value.entityId !== undefined && typeof value.entityId !== "string")
        )
          return null;
      }
    }
    for (const event of v.events as Record<string, unknown>[])
      if (!strings(event.entityIds) || !Number.isFinite(event.order))
        return null;
    for (const note of v.notes as Record<string, unknown>[])
      if (!strings(note.tags) || !strings(note.entityIds)) return null;
    for (const feedback of v.feedback as Record<string, unknown>[])
      if (
        !["category", "message", "at"].every(
          (key) => typeof feedback[key] === "string",
        )
      )
        return null;
    for (const node of v.nodes as Record<string, unknown>[])
      if (
        !["note", "image", "entity", "plot"].includes(String(node.kind)) ||
        !Number.isFinite(node.x) ||
        !Number.isFinite(node.y)
      )
        return null;
    return v as unknown as StudioData;
  } catch {
    return null;
  }
}
