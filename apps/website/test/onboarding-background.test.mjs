import assert from "node:assert/strict";
import { test } from "node:test";
import { stat } from "node:fs/promises";
import {
  backgroundReducer as reduce,
  initialBackground,
  scenes,
  stepScenes,
} from "../src/features/onboarding/background.ts";
test("the decorative background starts with a readable static fallback", () => {
  assert.deepEqual(initialBackground("archive"), {
    requested: "archive",
    visible: null,
    loaded: [],
    failed: [],
  });
});
test("the previous scene remains until the requested image is loaded", () => {
  let state = reduce(initialBackground("archive"), {
    type: "loaded",
    scene: "archive",
  });
  state = reduce(state, { type: "request", scene: "garden" });
  assert.equal(state.visible, "archive");
  state = reduce(state, { type: "loaded", scene: "garden" });
  assert.equal(state.visible, "garden");
});
test("late image loads cannot show a scene from an earlier step", () => {
  let state = reduce(initialBackground("archive"), {
    type: "request",
    scene: "horizon",
  });
  state = reduce(state, { type: "loaded", scene: "archive" });
  assert.equal(state.visible, null);
  state = reduce(state, { type: "loaded", scene: "horizon" });
  assert.equal(state.visible, "horizon");
});
test("media failure returns to the fallback rather than blocking or hiding the form", () => {
  let state = reduce(initialBackground("archive"), {
    type: "loaded",
    scene: "archive",
  });
  state = reduce(state, { type: "request", scene: "garden" });
  state = reduce(state, { type: "failed", scene: "garden" });
  assert.equal(state.visible, null);
  assert.deepEqual(state.failed, ["garden"]);
});
test("a late failure from another scene does not remove the current scene", () => {
  let state = reduce(initialBackground("horizon"), {
    type: "loaded",
    scene: "horizon",
  });
  state = reduce(state, { type: "failed", scene: "archive" });
  assert.equal(state.visible, "horizon");
});
test("Back reuses loaded scenes and keeps failure state stable", () => {
  let state = reduce(initialBackground("archive"), {
    type: "loaded",
    scene: "archive",
  });
  state = reduce(state, { type: "request", scene: "garden" });
  state = reduce(state, { type: "failed", scene: "garden" });
  state = reduce(state, { type: "request", scene: "archive" });
  assert.equal(state.visible, "archive");
  state = reduce(state, { type: "request", scene: "garden" });
  assert.equal(state.visible, null);
});
test("all five existing steps map to the three original environments", () => {
  assert.deepEqual(Object.keys(stepScenes), [
    "welcome",
    "purpose",
    "interests",
    "preferences",
    "begin",
  ]);
  for (const id of Object.values(stepScenes)) assert.ok(scenes[id]);
});
test("a successful responsive alternative recovers a scene that previously failed", () => {
  let state = reduce(initialBackground("archive"), {
    type: "failed",
    scene: "archive",
  });
  state = reduce(state, { type: "loaded", scene: "archive" });
  assert.equal(state.visible, "archive");
  assert.deepEqual(state.failed, []);
  state = reduce(state, { type: "request", scene: "archive" });
  assert.equal(state.visible, "archive");
});
test("all local responsive assets exist within the decorative image budget", async () => {
  for (const scene of Object.values(scenes))
    for (const path of [scene.src, scene.mobile]) {
      const info = await stat(new URL("../public" + path, import.meta.url));
      assert.ok(info.size > 1000);
      assert.ok(info.size < 160 * 1024, path);
    }
});
