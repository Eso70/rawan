import assert from "node:assert/strict";
import { test } from "node:test";
import { createDraft } from "../src/features/onboarding/model.ts";
import { submissionDraft } from "../src/features/onboarding/submission.ts";
import { parseSetupState } from "../src/features/onboarding/state.ts";
import {
  saveSetupRequest,
  SetupSaveError,
} from "../src/features/onboarding/services/save-setup.ts";
const state = () => ({
  version: 1,
  status: "in_progress",
  required: true,
  revision: 1,
  step: "purpose",
  draft: createDraft(),
  completedAt: null,
});
test("a save forwards preferences and revision without manufacturing age or completion", async () => {
  let request;
  const saved = state();
  const result = await saveSetupRequest(
    saved.draft,
    0,
    "purpose",
    false,
    async (path, options) => {
      request = { path, options };
      return Response.json(saved);
    },
  );
  assert.deepEqual(result, saved);
  assert.equal(request.path, "/api/setup");
  assert.equal(request.options.credentials, "same-origin");
  const body = JSON.parse(request.options.body);
  assert.equal(body.expectedRevision, 0);
  assert.equal(body.step, "purpose");
  for (const key of [
    "confirmAdult",
    "complete",
    "ageConfirmedAt",
    "completedAt",
    "userId",
    "role",
  ])
    assert.equal(Object.hasOwn(body, key), false);
});
test("completion succeeds without any declaration or browser timestamp", async () => {
  const saved = {
    ...state(),
    status: "completed",
    draft: { ...createDraft(), purpose: "read" },
    completedAt: new Date().toISOString(),
  };
  await saveSetupRequest(
    saved.draft,
    0,
    "begin",
    true,
    async (_path, options) => {
      const body = JSON.parse(options.body);
      assert.equal(Object.hasOwn(body, "confirmAdult"), false);
      assert.equal(body.complete, true);
      assert.equal(Object.hasOwn(body, "ageConfirmedAt"), false);
      return Response.json(saved);
    },
  );
});
test("expiry and revision conflicts remain recognizable even with non-JSON upstream errors", async () => {
  for (const status of [401, 409])
    await assert.rejects(
      saveSetupRequest(
        createDraft(),
        0,
        "welcome",
        false,
        async () => new Response("unavailable", { status }),
      ),
      (error) => error instanceof SetupSaveError && error.status === status,
    );
});
test("network, timeout and upstream failures give retryable text without changing the input draft", async () => {
  const draft = { ...createDraft(), preferredName: "Unsaved pen name" };
  for (const fetcher of [
    async () => {
      throw new TypeError("network details");
    },
    async () => {
      throw new DOMException("timeout", "TimeoutError");
    },
    async () => new Response("HTML error", { status: 503 }),
    async () =>
      Response.json(
        { message: "private database diagnostic" },
        { status: 500 },
      ),
  ]) {
    await assert.rejects(
      saveSetupRequest(draft, 0, "purpose", false, fetcher),
      (error) =>
        error instanceof SetupSaveError &&
        /try again/i.test(error.message) &&
        !/diagnostic|network details/.test(error.message),
    );
    assert.equal(draft.preferredName, "Unsaved pen name");
  }
});
test("a validation failure can be corrected and retried with the same revision", async () => {
  const draft = { ...createDraft(), preferredName: "Too long".repeat(30) };
  await assert.rejects(
    saveSetupRequest(draft, 0, "purpose", false, async () =>
      Response.json(
        { message: "Please use 80 characters or fewer." },
        { status: 400 },
      ),
    ),
    /80 characters/,
  );
  draft.preferredName = "Corrected";
  const saved = { ...state(), draft };
  assert.deepEqual(
    await saveSetupRequest(draft, 0, "purpose", false, async () =>
      Response.json(saved),
    ),
    saved,
  );
});
test("malformed successful replies are failures rather than completed setup or broken page state", async () => {
  for (const response of [
    new Response("not JSON"),
    Response.json({}),
    Response.json({ ...state(), status: "completed" }),
    Response.json({ ...state(), revision: -1 }),
    Response.json({ ...state(), step: "dashboard" }),
  ])
    await assert.rejects(
      saveSetupRequest(
        createDraft(),
        0,
        "welcome",
        false,
        async () => response,
      ),
      SetupSaveError,
    );
});
test("state parsing rejects invalid completion dates, incompatible versions and missing draft fields", () => {
  assert.deepEqual(parseSetupState(state()), state());
  for (const value of [
    null,
    {},
    { ...state(), version: 2 },
    { ...state(), completedAt: "yesterday" },
    { ...state(), draft: { ...createDraft(), readingFormats: null } },
    { ...state(), draft: { ...createDraft(), purpose: "ADMIN" } },
  ])
    assert.equal(parseSetupState(value), null);
});
test("optional name skipping ignores invalid unsaved text while preserving an earlier pen name", () => {
  const saved = { ...createDraft(), preferredName: "Earlier pen name" };
  const draft = { ...saved, preferredName: "Invisible\u200bname" };
  assert.equal(
    submissionDraft(draft, saved, "welcome", true).preferredName,
    "Earlier pen name",
  );
  assert.equal(draft.preferredName, "Invisible\u200bname");
  assert.equal(
    submissionDraft(
      { ...draft, preferredName: "  Quiet   Reader " },
      saved,
      "welcome",
      false,
    ).preferredName,
    "Quiet Reader",
  );
});
test("skipping optional interests and discovery preserves saved answers and hidden categories", () => {
  const saved = {
    ...createDraft(),
    purpose: "both",
    creativeInterests: ["novels"],
    readingFormats: ["comics"],
    readingGenres: ["fantasy"],
    readingTopics: ["history"],
    discoverySource: "Other",
    discoveryOther: "Earlier answer",
  };
  const changed = {
    ...saved,
    purpose: "read",
    creativeInterests: [],
    readingFormats: [],
    discoverySource: "Search engine",
    discoveryOther: "x".repeat(121),
  };
  const interests = submissionDraft(changed, saved, "interests", true);
  assert.deepEqual(interests.creativeInterests, ["novels"]);
  assert.deepEqual(interests.readingFormats, ["comics"]);
  assert.equal(interests.purpose, "read");
  const preferences = submissionDraft(changed, saved, "preferences", true);
  assert.equal(preferences.discoverySource, "Other");
  assert.equal(preferences.discoveryOther, "Earlier answer");
});

test("Unicode length limits match backend character counting and cannot trap a valid saved account", async () => {
  const { validateName, validateDraft } =
    await import("../src/features/onboarding/validation.ts");
  const name = "🌿".repeat(80);
  assert.equal(validateName(name), null);
  assert.ok(validateName(name + "🌿"));
  const draft = {
    ...createDraft(),
    preferredName: name,
    purpose: "read",
    discoverySource: "Other",
    discoveryOther: "🌿".repeat(120),
  };
  assert.equal(validateDraft(draft), null);
  assert.ok(parseSetupState({ ...state(), draft }));
  assert.equal(
    parseSetupState({
      ...state(),
      draft: { ...draft, discoveryOther: "🌿".repeat(121) },
    }),
    null,
  );
});
