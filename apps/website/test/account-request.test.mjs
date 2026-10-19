import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import {
  readAccount,
  sessionUser,
} from "../src/features/auth/server/account-request.ts";

const api = "http://127.0.0.1:3002/api/v1";
const user = {
  id: "test-user",
  name: "A writer",
  email: "writer@example.test",
};
const noPause = async () => {};

test("a temporary socket failure recovers once with an uncached authenticated GET", async () => {
  const requests = [];
  let pauses = 0;
  const result = await readAccount(
    api,
    "test-token",
    "/users/me",
    async (url, options) => {
      requests.push({ url, options });
      if (requests.length === 1) throw new TypeError("fetch failed");
      return Response.json(user);
    },
    async () => {
      pauses++;
    },
  );
  assert.deepEqual(result, { status: "ok", data: user });
  assert.equal(requests.length, 2);
  assert.equal(pauses, 1);
  for (const r of requests) {
    assert.equal(r.url, `${api}/users/me`);
    assert.equal(r.options.method, "GET");
    assert.equal(r.options.headers.Authorization, "Bearer test-token");
    assert.equal(r.options.cache, "no-store");
    assert.equal(r.options.redirect, "error");
    assert.ok(r.options.signal instanceof AbortSignal);
  }
});
test("persistent network refusal and timeouts return unavailable without throwing or fabricating identity", async () => {
  for (const error of [
    new TypeError("fetch failed"),
    new DOMException("timeout", "TimeoutError"),
  ]) {
    let calls = 0;
    const result = await readAccount(
      api,
      "test-token",
      "/users/me",
      async () => {
        calls++;
        throw error;
      },
      noPause,
    );
    assert.deepEqual(result, { status: "unavailable" });
    assert.equal(calls, 2);
    assert.equal(Object.hasOwn(result, "data"), false);
  }
});
test("temporary server failures retry once, but denied, missing and rate-limited responses never loop", async () => {
  for (const status of [500, 502, 503, 504]) {
    let calls = 0;
    assert.deepEqual(
      await readAccount(
        api,
        "test",
        "/users/me/setup",
        async () =>
          ++calls === 1
            ? new Response("Unavailable", { status })
            : Response.json({ revision: 1 }),
        noPause,
      ),
      { status: "ok", data: { revision: 1 } },
    );
    assert.equal(calls, 2);
  }
  for (const status of [400, 403, 404, 429]) {
    let calls = 0;
    assert.deepEqual(
      await readAccount(
        api,
        "test",
        "/users/me",
        async () => {
          calls++;
          return new Response("Unavailable", { status });
        },
        noPause,
      ),
      { status: "unavailable" },
    );
    assert.equal(calls, 1);
  }
});
test("401 remains an expired session and cannot recover into an authenticated result", async () => {
  for (const path of ["/users/me", "/users/me/setup"]) {
    let calls = 0;
    assert.deepEqual(
      await readAccount(
        api,
        "test",
        path,
        async () => {
          calls++;
          return new Response(null, { status: 401 });
        },
        noPause,
      ),
      { status: "expired" },
    );
    assert.equal(calls, 1);
  }
  let calls = 0;
  assert.deepEqual(
    await readAccount(
      api,
      "test",
      "/users/me",
      async () =>
        ++calls === 1
          ? new Response(null, { status: 503 })
          : new Response(null, { status: 401 }),
      noPause,
    ),
    { status: "expired" },
  );
  assert.equal(calls, 2);
});
test("malformed upstream JSON fails closed, and session identity is validated before use", async () => {
  assert.deepEqual(
    await readAccount(
      api,
      "test",
      "/users/me",
      async () => new Response("<html>not an account</html>", { status: 200 }),
      noPause,
    ),
    { status: "unavailable" },
  );
  assert.deepEqual(
    sessionUser({ ...user, role: "AUTHOR", privateField: "ignored" }),
    user,
  );
  for (const value of [
    null,
    [],
    {},
    { ...user, id: "" },
    { ...user, name: null },
    { ...user, email: 42 },
  ])
    assert.equal(sessionUser(value), null);
});
test("real HTTP connection reset recovers on a disposable local server", async () => {
  let calls = 0;
  const server = createServer((req, res) => {
    calls++;
    if (calls === 1) {
      req.socket.destroy();
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(user));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    assert.deepEqual(
      await readAccount(
        `http://127.0.0.1:${address.port}`,
        "test-only",
        "/users/me",
        fetch,
        noPause,
      ),
      { status: "ok", data: user },
    );
    assert.ok(calls >= 2);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
