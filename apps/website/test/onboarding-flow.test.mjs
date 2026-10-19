import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDraft,
  choosePurpose,
} from "../src/features/onboarding/model.ts";
import {
  decodeSnapshot,
  encodeSnapshot,
  freshSnapshot,
  steps,
  visibleSteps,
  visibleStep,
} from "../src/features/onboarding/flow.ts";

test("five stable steps cover welcome, purpose, interests, preferences and beginning", () => {
  assert.deepEqual(steps, [
    "welcome",
    "purpose",
    "interests",
    "preferences",
    "begin",
  ]);
});
test("the visible flow finishes at preferences and resumes old begin drafts there", () => {
  assert.deepEqual(visibleSteps, [
    "welcome",
    "purpose",
    "interests",
    "preferences",
  ]);
  assert.equal(visibleSteps.at(-1), "preferences");
  assert.equal(visibleStep("begin"), "preferences");
  for (const step of visibleSteps) assert.equal(visibleStep(step), step);
});
test("tab refresh restores progress and all preference categories without losing hidden interests", () => {
  let draft = {
    ...createDraft(),
    preferredName: "River",
    creativeInterests: ["novels"],
    readingFormats: ["manga"],
    readingGenres: ["fantasy"],
    readingTopics: ["science"],
  };
  draft = choosePurpose(draft, "read");
  const snapshot = { draft, step: "interests", completed: false };
  assert.deepEqual(decodeSnapshot(encodeSnapshot(snapshot)), snapshot);
  assert.deepEqual(
    decodeSnapshot(encodeSnapshot(snapshot)).draft.creativeInterests,
    ["novels"],
  );
});
test("malformed, oversized, duplicate, unknown and privileged tab data are rejected", () => {
  const snapshot = freshSnapshot();
  for (const raw of [
    null,
    "broken",
    "x".repeat(6001),
    JSON.stringify({ ...snapshot, version: 2 }),
    JSON.stringify({
      version: 1,
      ...snapshot,
      draft: { ...snapshot.draft, role: "ADMIN" },
    }),
    JSON.stringify({
      version: 1,
      ...snapshot,
      draft: { ...snapshot.draft, interfaceLanguage: "ar" },
    }),
    JSON.stringify({
      version: 1,
      ...snapshot,
      draft: { ...snapshot.draft, creativeInterests: ["novels", "novels"] },
    }),
    JSON.stringify({
      version: 1,
      ...snapshot,
      draft: { ...snapshot.draft, readingGenres: ["made-up"] },
    }),
  ])
    assert.equal(decodeSnapshot(raw), null);
});
test("restored progress cannot bypass the required purpose or field validation", () => {
  const empty = decodeSnapshot(
    encodeSnapshot({ ...freshSnapshot(), step: "begin", completed: true }),
  );
  assert.equal(empty.step, "purpose");
  assert.equal(empty.completed, false);
  const invalid = decodeSnapshot(
    encodeSnapshot({
      draft: {
        ...choosePurpose(createDraft(), "create"),
        preferredName: "x".repeat(81),
      },
      step: "begin",
      completed: true,
    }),
  );
  assert.equal(invalid.step, "welcome");
  assert.equal(invalid.completed, false);
});
test("preview summary can be refreshed but has no account completion timestamp", () => {
  const saved = decodeSnapshot(
    encodeSnapshot({
      draft: choosePurpose(createDraft(), "both"),
      step: "begin",
      completed: true,
    }),
  );
  assert.equal(saved.completed, true);
  assert.equal(Object.hasOwn(saved.draft, "completedAt"), false);
});
