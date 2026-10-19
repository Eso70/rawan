import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/features/studio/data/seed.ts";
import {
  addProject,
  addChapter,
  addEntity,
  patchRow,
  insertRow,
  deleteRow,
  reorderChapter,
  searchData,
  encodeData,
  decodeData,
  restoreSceneDrafts,
  DRAFT_KEY,
  workWords,
  wordCount,
} from "../src/features/studio/data/repository.ts";
import { resolveStudioRoute } from "../src/features/studio/data/routes.ts";

test("studio seed is deterministic, inhabited and independent between callers", () => {
  const a = createSeed();
  const b = createSeed();
  assert.deepEqual(a, b);
  assert.equal(a.projects.length, 5);
  assert.equal(a.works.length, 7);
  assert.ok(a.chapters.length >= 20);
  assert.ok(a.entities.length >= 30);
  assert.ok(a.events.length >= 15);
  assert.ok(a.relationships.length >= 15);
  assert.ok(a.notes.length >= 15);
  a.projects[0].title = "Changed";
  assert.notEqual(a.projects[0].title, b.projects[0].title);
});
function assertIntegrity(d) {
  const projects = new Map(d.projects.map((p) => [p.id, p]));
  const works = new Map(d.works.map((w) => [w.id, w]));
  const chapters = new Map(d.chapters.map((c) => [c.id, c]));
  const entities = new Map(d.entities.map((e) => [e.id, e]));
  const nodes = new Map(d.nodes.map((n) => [n.id, n]));
  for (const w of d.works) assert.ok(projects.has(w.projectId));
  for (const c of d.chapters) assert.ok(works.has(c.workId));
  for (const s of d.scenes) assert.ok(chapters.has(s.chapterId));
  for (const e of d.entities) {
    assert.ok(projects.has(e.projectId));
    for (const p of e.properties)
      if (p.entityId)
        assert.equal(entities.get(p.entityId)?.projectId, e.projectId);
  }
  for (const r of d.relationships) {
    assert.equal(entities.get(r.sourceId)?.projectId, r.projectId);
    assert.equal(entities.get(r.targetId)?.projectId, r.projectId);
  }
  for (const e of d.events) {
    assert.equal(d.eras.find((v) => v.id === e.eraId)?.projectId, e.projectId);
    for (const id of e.entityIds)
      assert.equal(entities.get(id)?.projectId, e.projectId);
  }
  for (const p of d.points) {
    assert.equal(d.arcs.find((a) => a.id === p.arcId)?.projectId, p.projectId);
    if (p.chapterId)
      assert.equal(
        works.get(chapters.get(p.chapterId)?.workId)?.projectId,
        p.projectId,
      );
  }
  for (const n of d.notes)
    for (const id of n.entityIds)
      assert.equal(entities.get(id)?.projectId, n.projectId);
  for (const e of d.edges) {
    assert.equal(nodes.get(e.source)?.projectId, e.projectId);
    assert.equal(nodes.get(e.target)?.projectId, e.projectId);
  }
  for (const collection of [
    d.projects,
    d.works,
    d.chapters,
    d.scenes,
    d.entities,
    d.events,
    d.relationships,
    d.notes,
    d.nodes,
    d.edges,
  ])
    assert.equal(new Set(collection.map((r) => r.id)).size, collection.length);
}
test("all seeded references resolve within the intended project", () =>
  assertIntegrity(createSeed()));
test("project creation validates input and keeps original data immutable", () => {
  const d = createSeed();
  const next = addProject(
    d,
    {
      title: "  River notebook  ",
      description: "Field research",
      kind: "Non-fiction",
    },
    "new-project",
    "2026-10-19T10:00:00Z",
  );
  assert.equal(d.projects.length, 5);
  assert.equal(next.projects.at(-1).title, "River notebook");
  assert.equal(next.projects.at(-1).id, "new-project");
  assertIntegrity(next);
  assert.throws(() =>
    addProject(d, { title: " ", description: "", kind: "Novel" }),
  );
});
test("chapter creation adds a correctly owned opening scene and forbids comic prose", () => {
  const d = addChapter(
    createSeed(),
    "p1-w1",
    "A second beginning",
    "chapter-new",
  );
  assert.equal(d.scenes.at(-1).chapterId, "chapter-new");
  assert.equal(d.chapters.at(-1).position, 6);
  assertIntegrity(d);
  assert.throws(() => addChapter(d, "p5-w1", "A comic page"));
  assert.throws(() => addChapter(d, "missing", "No work"));
});
test("writing edits round-trip through persistence with formatting and last location", () => {
  const d = createSeed();
  const html =
    "<h2>At the river</h2><p>A <strong>changed</strong> sentence with <em>room</em> to breathe.</p>";
  const next = patchRow(d, "scenes", d.lastSceneId, {
    content: html,
    updatedAt: "2026-10-19T11:00:00Z",
  });
  const saved = decodeData(encodeData(next));
  assert.ok(saved);
  assert.equal(
    saved.scenes.find((s) => s.id === saved.lastSceneId).content,
    html,
  );
  assert.equal(d.scenes[0].content.includes("changed"), false);
  assert.ok(workWords(saved, "p1-w1") > 0);
  assert.equal(wordCount("<p></p>"), 0);
});
test("newer recovery drafts survive a reload before the debounced repository save", () => {
  const d = createSeed();
  const draft = {
    content: "<p>The newest sentence.</p>",
    at: "2026-10-19T12:00:00Z",
  };
  const recovered = restoreSceneDrafts(d, (key) =>
    key === DRAFT_KEY + d.scenes[0].id ? JSON.stringify(draft) : null,
  );
  assert.equal(recovered.scenes[0].content, draft.content);
  assert.deepEqual(
    restoreSceneDrafts(d, () => "broken"),
    d,
  );
  assert.deepEqual(
    restoreSceneDrafts(d, () => JSON.stringify({ ...draft, at: "2020-01-01" })),
    d,
  );
});
test("chapter reorder stays within its work and keeps unique contiguous positions", () => {
  const d = createSeed();
  const other = d.chapters.filter((c) => c.workId !== "p1-w1");
  const next = reorderChapter(d, "p1-w1-c2", -1);
  assert.equal(next.chapters.find((c) => c.id === "p1-w1-c2").position, 0);
  assert.equal(next.chapters.find((c) => c.id === "p1-w1-c1").position, 1);
  assert.deepEqual(
    next.chapters.filter((c) => c.workId !== "p1-w1"),
    other,
  );
  assert.deepEqual(reorderChapter(d, "p1-w1-c1", -1), d);
});
test("entity edits, aliases, linked properties and related navigation persist locally", () => {
  let d = addEntity(createSeed(), "p2", "Character", "Maren", "maren");
  const place = d.entities.find(
    (e) => e.projectId === "p2" && e.kind === "Location",
  );
  d = patchRow(d, "entities", "maren", {
    aliases: ["The keeper"],
    tags: ["north"],
    properties: [
      { id: "home", label: "Home", value: place.name, entityId: place.id },
    ],
    description: "A keeper of letters.",
  });
  const saved = decodeData(encodeData(d));
  assert.ok(saved);
  assert.equal(
    saved.entities.find((e) => e.id === "maren").properties[0].entityId,
    place.id,
  );
  assertIntegrity(saved);
});
test("entity deletion cleans relationships, references, event and note links", () => {
  const d = deleteRow(createSeed(), "entities", "p1-e1");
  assert.ok(
    !d.relationships.some(
      (r) => r.sourceId === "p1-e1" || r.targetId === "p1-e1",
    ),
  );
  assert.ok(!d.events.some((e) => e.entityIds.includes("p1-e1")));
  assert.ok(!d.notes.some((e) => e.entityIds.includes("p1-e1")));
  assertIntegrity(d);
});
test("project deletion cascades only its owned mock content", () => {
  const before = createSeed();
  const after = deleteRow(before, "projects", "p1");
  assert.equal(after.projects.length, 4);
  assert.ok(!after.works.some((w) => w.projectId === "p1"));
  assert.ok(!after.scenes.some((s) => s.id.startsWith("p1-")));
  assert.deepEqual(
    after.entities.filter((e) => e.projectId === "p2"),
    before.entities.filter((e) => e.projectId === "p2"),
  );
  assertIntegrity(after);
  assert.ok(after.scenes.some((s) => s.id === after.lastSceneId));
});
test("canvas edits and edges persist, and deleting a card removes its connections", () => {
  let d = patchRow(createSeed(), "nodes", "p1-node1", {
    x: 777,
    y: 222,
    text: "A revised question",
  });
  d = insertRow(d, "edges", {
    id: "new-edge",
    projectId: "p1",
    source: "p1-node1",
    target: "p1-node2",
    label: "suggests",
  });
  const restored = decodeData(encodeData(d));
  assert.equal(restored.nodes.find((n) => n.id === "p1-node1").x, 777);
  assertIntegrity(restored);
  d = deleteRow(restored, "nodes", "p1-node1");
  assert.ok(
    !d.edges.some((e) => e.source === "p1-node1" || e.target === "p1-node1"),
  );
  assertIntegrity(d);
});
test("unified search finds prose, aliases, notes, places and scoped results", () => {
  const d = createSeed();
  assert.ok(searchData(d, "Mira").some((r) => r.kind === "Characters"));
  assert.ok(searchData(d, "disappearing").length > 0);
  assert.ok(searchData(d, "apprentice").some((r) => r.kind === "Characters"));
  assert.ok(searchData(d, "texture").some((r) => r.kind === "Notes"));
  assert.ok(searchData(d, "Cinder").some((r) => r.kind === "Locations"));
  assert.ok(searchData(d, "Mira", "p2").length === 0);
  assert.deepEqual(searchData(d, " "), []);
});
test("preferences are persisted with actual supported mock ranges", () => {
  const d = createSeed();
  d.preferences = {
    ...d.preferences,
    theme: "light",
    font: "sans",
    fontSize: 24,
    editorWidth: 800,
    lineHeight: 2,
    reducedMotion: true,
    compact: true,
  };
  assert.deepEqual(decodeData(encodeData(d)).preferences, d.preferences);
  d.preferences.fontSize = 300;
  assert.equal(decodeData(encodeData(d)), null);
});
test("corrupt, wrong-version and invalid row storage are rejected safely", () => {
  assert.equal(decodeData(null), null);
  assert.equal(decodeData("broken"), null);
  const d = createSeed();
  assert.equal(decodeData(JSON.stringify({ ...d, version: 2 })), null);
  assert.equal(
    decodeData(JSON.stringify({ ...d, scenes: [{ id: "x", content: 42 }] })),
    null,
  );
  assert.equal(
    decodeData(
      JSON.stringify({
        ...d,
        preferences: { ...d.preferences, theme: "neon" },
      }),
    ),
    null,
  );
  assert.equal(decodeData(JSON.stringify({ ...d, entities: null })), null);
});
test("route map handles direct project tools, entity documents, and invalid paths", () => {
  assert.deepEqual(resolveStudioRoute([]), { page: "dashboard" });
  assert.equal(resolveStudioRoute(["projects"]).page, "projects");
  assert.deepEqual(resolveStudioRoute(["projects", "p1", "world", "p1-e1"]), {
    page: "project",
    projectId: "p1",
    tool: "world",
    entityId: "p1-e1",
  });
  for (const tool of [
    "works",
    "manuscript",
    "plot",
    "timeline",
    "relationships",
    "canvas",
    "research",
    "media",
    "settings",
  ])
    assert.equal(resolveStudioRoute(["projects", "p1", tool]).page, "project");
  assert.equal(
    resolveStudioRoute(["projects", "p1", "made-up"]).page,
    "not-found",
  );
  assert.equal(
    resolveStudioRoute(["projects", "p1", "canvas", "extra"]).page,
    "not-found",
  );
});

test("prose chapters have distinct openings and comic concepts stay outside prose editing", () => {
  const d = createSeed();
  const work = d.works.find((w) => w.kind === "Comic");
  assert.ok(work);
  assert.equal(
    d.chapters.some((c) => c.workId === work.id),
    false,
  );
  const openings = d.chapters
    .filter((c) => c.workId === "p1-w1")
    .map((c) => d.scenes.find((s) => s.chapterId === c.id).content);
  assert.equal(new Set(openings).size, openings.length);
});
test("nested malformed properties, invalid entity kinds and feedback cannot break hydration", () => {
  const d = createSeed();
  d.entities[0].properties = [null];
  assert.equal(decodeData(encodeData(d)), null);
  const other = createSeed();
  other.entities[0].kind = "Invented";
  assert.equal(decodeData(encodeData(other)), null);
  const feedback = createSeed();
  feedback.feedback = [{ id: "bad", category: "Idea", message: {}, at: "now" }];
  assert.equal(decodeData(encodeData(feedback)), null);
});
test("asset removal detaches only the selected project's matching references", () => {
  const d = createSeed();
  const after = deleteRow(d, "media", "p1-media3");
  assert.equal(after.entities.find((e) => e.id === "p1-e1").image, "");
  assert.equal(
    after.entities.find((e) => e.id === "p2-e1").image,
    d.entities.find((e) => e.id === "p2-e1").image,
  );
});
