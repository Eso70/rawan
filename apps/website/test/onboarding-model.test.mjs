import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDraft,
  choosePurpose,
  displayName,
  hasCreativeInterests,
  hasReadingInterests,
  startingExperience,
} from "../src/features/onboarding/model.ts";

test("one account draft separates interests from authorization and identity", () => {
  const draft = createDraft();
  for (const field of [
    "role",
    "userId",
    "accessToken",
    "completedAt",
    "ageEligibilityConfirmedAt",
  ])
    assert.equal(Object.hasOwn(draft, field), false);
  assert.deepEqual(["create", "read", "both"].map(startingExperience), [
    "studio",
    "reader",
    "studio",
  ]);
});
test("changing purpose preserves both sets of interests and preselects a starting preference", () => {
  const draft = {
    ...createDraft(),
    creativeInterests: ["novels"],
    readingFormats: ["poetry"],
  };
  const create = choosePurpose(draft, "create");
  assert.equal(create.preferredStart, "studio");
  const read = choosePurpose(create, "read");
  assert.equal(read.preferredStart, "reader");
  assert.deepEqual(read.creativeInterests, ["novels"]);
  assert.deepEqual(read.readingFormats, ["poetry"]);
  assert.equal(choosePurpose(read, "both").preferredStart, "studio");
  assert.equal(draft.purpose, null);
});
test("purpose controls interest visibility, never access to another experience", () => {
  assert.equal(hasCreativeInterests("create"), true);
  assert.equal(hasCreativeInterests("read"), false);
  assert.equal(hasReadingInterests("read"), true);
  assert.equal(hasReadingInterests("create"), false);
  assert.equal(hasCreativeInterests("both"), true);
  assert.equal(hasReadingInterests("both"), true);
  assert.equal(hasCreativeInterests(null), false);
});
test("optional preferred name normalizes whitespace and never erases an existing display name", () => {
  assert.equal(
    displayName(
      { ...createDraft(), preferredName: "  Rawan   Writer " },
      "Existing",
    ),
    "Rawan Writer",
  );
  assert.equal(displayName(createDraft(), "Existing"), "Existing");
  assert.equal(displayName(createDraft()), "storyteller");
});
