import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDraft,
  choosePurpose,
} from "../src/features/onboarding/model.ts";
import {
  normalizeName,
  validateName,
  validateDraft,
} from "../src/features/onboarding/validation.ts";
import {
  creativeGroups,
  readingFormatGroups,
  readingGenreGroups,
  readingTopicGroups,
} from "../src/features/onboarding/options.ts";

test("purpose is the only required preview answer; optional preferences may be empty", () => {
  assert.match(validateDraft(createDraft()), /Choose/);
  const draft = choosePurpose(createDraft(), "both");
  assert.equal(draft.preferredStart, "studio");
  assert.equal(validateDraft(draft), null);
});
test("names normalize whitespace, accept pen names, and reject excessive or hidden input", () => {
  assert.equal(normalizeName("  River   Quill  "), "River Quill");
  assert.equal(validateName(""), null);
  assert.equal(validateName("River Quill"), null);
  assert.notEqual(validateName("x".repeat(81)), null);
  assert.notEqual(validateName("River\u0000Quill"), null);
});
test("discovery note length is bounded without requiring a source", () => {
  const draft = choosePurpose(createDraft(), "read");
  assert.equal(
    validateDraft({ ...draft, discoveryOther: "x".repeat(120) }),
    null,
  );
  assert.notEqual(
    validateDraft({
      ...draft,
      discoverySource: "Other",
      discoveryOther: "x".repeat(121),
    }),
    null,
  );
});
test("interest catalogues keep creating formats separate from reading formats, genres and topics", () => {
  const values = (groups) =>
    groups.flatMap((group) => group.options.map((option) => option.value));
  assert.ok(values(creativeGroups).includes("worldbuilding-and-lore"));
  assert.ok(values(readingFormatGroups).includes("manga"));
  assert.ok(values(readingGenreGroups).includes("fantasy"));
  assert.ok(values(readingTopicGroups).includes("philosophy"));
  assert.equal(values(creativeGroups).includes("fantasy"), false);
  for (const groups of [
    creativeGroups,
    readingFormatGroups,
    readingGenreGroups,
    readingTopicGroups,
  ])
    assert.equal(new Set(values(groups)).size, values(groups).length);
});
