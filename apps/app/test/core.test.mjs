import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApiError,
  apiBaseUrl,
  errorMessage,
  requestJson,
} from "../src/lib/api-core.ts";
import { collectionPath, resourcePath } from "../src/lib/paths.ts";
import { sessionOptions } from "../src/lib/session-options.ts";

test("API requests use JSON, bearer authorization, no caching, and a timeout", async () => {
  let request;
  const result = await requestJson(
    "http://localhost:3002/api/v1",
    "/projects",
    {
      method: "POST",
      token: "test-token",
      body: { title: "A story" },
    },
    async (url, init) => {
      request = { url, init };
      return Response.json({ id: "project-1" }, { status: 201 });
    },
  );
  assert.deepEqual(result, { id: "project-1" });
  assert.equal(request.url, "http://localhost:3002/api/v1/projects");
  assert.equal(request.init.headers.Authorization, "Bearer test-token");
  assert.equal(request.init.headers["Content-Type"], "application/json");
  assert.equal(request.init.body, JSON.stringify({ title: "A story" }));
  assert.equal(request.init.cache, "no-store");
  assert.equal(request.init.redirect, "error");
  assert.ok(request.init.signal instanceof AbortSignal);
});

test("anonymous auth requests never add a bearer token", async () => {
  await requestJson(
    "http://localhost:3002/api/v1",
    "/auth/login",
    { method: "POST", body: {} },
    async (_url, init) => {
      assert.equal(init.headers.Authorization, undefined);
      return Response.json({});
    },
  );
});

test("upstream response bodies cannot leak sensitive error details", async () => {
  for (const status of [400, 401, 403, 404, 409, 413, 429, 500]) {
    await assert.rejects(
      requestJson("http://localhost:3002/api/v1", "/projects", {}, async () =>
        Response.json({ message: "SENSITIVE_DATABASE_DETAIL" }, { status }),
      ),
      (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, status);
        assert.ok(!errorMessage(error).includes("SENSITIVE"));
        return true;
      },
    );
  }
  assert.match(errorMessage(new ApiError(409)), /already exists/);
  assert.match(errorMessage(new ApiError(401), true), /email or password/);
});

test("network failure and invalid JSON produce safe API errors", async () => {
  await assert.rejects(
    requestJson("http://localhost:3002/api/v1", "/projects", {}, async () => {
      throw new Error("private host details");
    }),
    (error) => error.status === 503,
  );
  await assert.rejects(
    requestJson(
      "http://localhost:3002/api/v1",
      "/projects",
      {},
      async () => new Response("not json"),
    ),
    (error) => error.status === 502,
  );
});

test("base URL validation requires explicit production configuration and safe transport", () => {
  assert.equal(apiBaseUrl(undefined), "http://localhost:3002/api/v1");
  assert.equal(
    apiBaseUrl("https://api.example.com/api/v1/"),
    "https://api.example.com/api/v1",
  );
  for (const url of [
    undefined,
    "file:///tmp/data",
    "http://user:password@example.com",
    "http://api.example.com/api/v1",
    "https://api.example.com?key=secret",
  ]) {
    assert.throws(() => apiBaseUrl(url, true), ApiError);
  }
  assert.equal(
    apiBaseUrl("http://127.0.0.1:3002/api/v1", true),
    "http://127.0.0.1:3002/api/v1",
  );
});

test("hierarchy paths constrain untrusted IDs and support every level", () => {
  assert.equal(collectionPath([]), "/projects");
  assert.equal(
    resourcePath(["p", "b", "c", "s"]),
    "/projects/p/books/b/chapters/c/scenes/s",
  );
  assert.equal(
    collectionPath(["p", "b", "c"]),
    "/projects/p/books/b/chapters/c/scenes",
  );
  for (const id of [
    "../users",
    "",
    "x?secret",
    "x/y",
    "https://example.com",
    "x".repeat(129),
  ])
    assert.throws(() => resourcePath([id]));
  assert.throws(() => collectionPath(["p", "b", "c", "s"]));
});

test("API client rejects traversal and absolute paths without issuing a request", async () => {
  for (const path of [
    "//example.com",
    "/../../users",
    "https://example.com",
    "/projects?x=1",
    "/projects#x",
  ]) {
    await assert.rejects(
      requestJson("http://localhost:3002/api/v1", path, {}, async () => {
        assert.fail("Should not fetch");
      }),
      ApiError,
    );
  }
});

test("sessions are HttpOnly, SameSite, host-scoped, and expire with the access token", () => {
  const production = sessionOptions(true, 604800);
  assert.equal(production.name, "__Host-rawan-session");
  assert.equal(production.secure, true);
  assert.equal(production.httpOnly, true);
  assert.equal(production.sameSite, "lax");
  assert.equal(production.path, "/");
  assert.equal(production.domain, undefined);
  assert.equal(sessionOptions(false, 60).maxAge, 60);
  assert.equal(sessionOptions(false, 999999).maxAge, 604800);
  assert.equal(sessionOptions(false, -1).maxAge, 0);
});
