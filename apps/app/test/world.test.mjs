import assert from "node:assert/strict";
import { test } from "node:test";
import {
  worldCollection,
  worldResource,
  worldPage,
  worldKind,
} from "../src/lib/world-paths.ts";
import { requestJson } from "../src/lib/api-core.ts";
test("world paths constrain collection names and IDs", () => {
  for (const kind of ["characters", "places", "factions", "artifacts"]) {
    assert.equal(worldKind(kind), kind);
    assert.equal(
      worldCollection("project-1", kind),
      `/projects/project-1/${kind}`,
    );
    assert.equal(worldResource(kind, "entity-1"), `/${kind}/entity-1`);
    assert.equal(
      worldPage("project-1", kind, "entity-1"),
      `/projects/project-1/${kind}/entity-1`,
    );
  }
  for (const value of ["books", "../characters", "https://example.com"])
    assert.throws(() => worldKind(value));
  for (const value of ["", "../other", "a/b", "a?b"]) {
    assert.throws(() => worldCollection(value, "places"));
    assert.throws(() => worldResource("places", value));
  }
});
test("deletion accepts an empty 204 response without trying to parse JSON", async () => {
  const result = await requestJson(
    "http://localhost:3002/api/v1",
    "/characters/entity-1",
    { method: "DELETE", token: "test-token" },
    async (_url, options) => {
      assert.equal(options.method, "DELETE");
      assert.equal(options.headers.Authorization, "Bearer test-token");
      return new Response(null, { status: 204 });
    },
  );
  assert.equal(result, undefined);
});
