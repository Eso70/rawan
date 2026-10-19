import { test } from "node:test";
import assert from "node:assert/strict";
import { createDraft } from "../src/features/onboarding/model.ts";
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
} from "../src/features/onboarding/options.ts";
import {
  interestCategories,
  categoriesFromDraft,
  interestOptions,
  hasInterestChoices,
} from "../src/features/onboarding/interest-flow.ts";

test("Create, Read and Both expose their own broad categories", () => {
  assert.equal(interestCategories("create").length, 11);
  assert.equal(interestCategories("read").length, 14);
  assert.equal(interestCategories("both").length, 25);
  assert.equal(interestCategories(null).length, 0);
});
test("the second screen includes only concrete options from selected categories", () => {
  const fiction = interestCategories("create").find(
    (item) => item.label === "Fiction",
  );
  assert.deepEqual(
    interestOptions("create", [fiction.id], "creativeInterests"),
    fiction.options,
  );
  assert.deepEqual(
    interestOptions("create", [fiction.id], "readingGenres"),
    [],
  );
  assert.deepEqual(
    interestOptions("read", [fiction.id], "creativeInterests"),
    [],
  );
});
test("saved choices infer categories on resume without losing hidden interests", () => {
  const draft = {
    ...createDraft(),
    purpose: "both",
    creativeInterests: ["novels"],
    readingGenres: ["fantasy"],
    readingTopics: ["history"],
  };
  const before = structuredClone(draft);
  assert.deepEqual(categoriesFromDraft(draft), [
    "creative-0",
    "reading-fantasy",
    "reading-history",
  ]);
  interestOptions("read", categoriesFromDraft(draft), "readingGenres");
  assert.deepEqual(draft, before);
});
test("empty and stale categories allow optional interests to advance without an empty screen", () => {
  assert.equal(hasInterestChoices("both", []), false);
  assert.equal(hasInterestChoices("create", ["reading-fantasy"]), false);
  assert.equal(hasInterestChoices("read", ["reading-fantasy"]), true);
});
test("all original concrete choices remain reachable and separated by preference field", () => {
  const all = interestCategories("both");
  for (const field of [
    "creativeInterests",
    "readingFormats",
    "readingGenres",
    "readingTopics",
  ]) {
    const original = {
      creativeInterests: creativeGroups,
      readingFormats: readingFormatGroups,
      readingGenres: readingGenreGroups,
      readingTopics: readingTopicGroups,
    };
    const expected = original[field]
      .flatMap((group) => group.options)
      .map((option) => option.value)
      .sort();
    assert.deepEqual(
      interestOptions(
        "both",
        all.map((category) => category.id),
        field,
      )
        .map((option) => option.value)
        .sort(),
      expected,
    );
  }
});
test("specific categories narrow the next screen without redundant one-option screens", () => {
  for (const category of interestCategories("both"))
    assert.ok(category.options.length >= 2, category.label);
  assert.deepEqual(
    interestOptions("read", ["reading-mystery"], "readingGenres").map(
      (option) => option.value,
    ),
    ["mystery", "thriller", "horror"],
  );
  assert.deepEqual(
    interestOptions("create", ["creative-poetry"], "creativeInterests").map(
      (option) => option.value,
    ),
    ["poetry", "essays", "spoken-word", "songwriting"],
  );
});
