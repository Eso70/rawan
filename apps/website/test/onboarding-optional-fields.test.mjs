import { test } from "node:test";
import assert from "node:assert/strict";
import {
  choosePurpose,
  createDraft,
} from "../src/features/onboarding/model.ts";
import { validateDraft } from "../src/features/onboarding/validation.ts";

test("a hidden discovery note cannot block another optional source choice", () => {
  const draft = {
    ...choosePurpose(createDraft(), "read"),
    discoverySource: "Other",
    discoveryOther: "x".repeat(121),
  };
  assert.notEqual(validateDraft(draft), null);
  assert.equal(
    validateDraft({ ...draft, discoverySource: "Prefer not to say" }),
    null,
  );
});
