import assert from "node:assert/strict";
import { test } from "node:test";
import { requestJson } from "../src/lib/api-core.ts";
test("entity relationship queries preserve private authorization", async () => {
  await requestJson(
    "http://localhost:3002/api/v1",
    "/projects/p1/relationships?entityKind=CHARACTER&entityId=c1",
    { token: "private" },
    async (url, options) => {
      assert.equal(
        url,
        "http://localhost:3002/api/v1/projects/p1/relationships?entityKind=CHARACTER&entityId=c1",
      );
      assert.equal(options.headers.Authorization, "Bearer private");
      return Response.json([]);
    },
  );
});
test("API client rejects arbitrary queries, malformed IDs and URL injection", async () => {
  for (const suffix of [
    "?entityKind=USER&entityId=x",
    "?entityKind=PLACE&entityId=../x",
    "?entityKind=PLACE&entityId=x&redirect=https://evil.invalid",
    "?entityKind=PLACE&entityId=x#fragment",
    "?entityKind=PLACE&entityId=x?extra",
  ]) {
    await assert.rejects(
      () =>
        requestJson(
          "http://localhost:3002/api/v1",
          "/projects/p1/relationships" + suffix,
          {},
          async () => {
            throw new Error("must not fetch");
          },
        ),
      (error) => error.status === 400,
    );
  }
});
