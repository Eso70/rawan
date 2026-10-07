import test from "node:test";
import assert from "node:assert/strict";
import { dashboardFor } from "../src/lib/experience.ts";
test("dashboard selection distinguishes writing, reading, both and optional skip", () => {
  assert.equal(dashboardFor("author"), "/workspace/author");
  assert.equal(dashboardFor("reader"), "/workspace/reader");
  assert.equal(dashboardFor("both"), "/workspace/author");
  assert.equal(dashboardFor("explore"), "/workspace/reader");
});
