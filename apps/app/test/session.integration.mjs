import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
const fetch = (url, options = {}) =>
  globalThis.fetch(url, { ...options, signal: AbortSignal.timeout(10000) });

// Focused HTTP contract test against the real built Next.js app. The isolated
// upstream fixture tests session plumbing only, not the real PostgreSQL flow.
const token = "session-test-token-only";
const upstream = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (
    request.url === "/api/v1/auth/login" ||
    request.url === "/api/v1/auth/register"
  ) {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (data.password !== "correct test passphrase") {
      response
        .writeHead(401)
        .end(JSON.stringify({ message: "private upstream error" }));
      return;
    }
    response.end(
      JSON.stringify({
        accessToken: token,
        tokenType: "Bearer",
        expiresIn: 604800,
        user: { id: "test-user" },
      }),
    );
    return;
  }
  if (request.headers.authorization !== `Bearer ${token}`) {
    response.writeHead(401).end("{}");
    return;
  }
  if (request.url === "/api/v1/users/me") {
    response.end(
      JSON.stringify({
        id: "test-user",
        name: "Session test author",
        email: "test@example.invalid",
        role: "AUTHOR",
      }),
    );
    return;
  }
  if (request.url === "/api/v1/projects") {
    response.end("[]");
    return;
  }
  response.writeHead(404).end("{}");
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const reserve = createServer();
reserve.listen(0, "127.0.0.1");
await once(reserve, "listening");
const port = reserve.address().port;
await new Promise((resolve) => reserve.close(resolve));
const origin = `http://localhost:${port}`;
const child = spawn(
  process.execPath,
  [
    fileURLToPath(import.meta.resolve("next/dist/bin/next")),
    "start",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      API_URL: `http://127.0.0.1:${upstream.address().port}/api/v1`,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
let serverOutput = "";
child.stdout.on("data", (data) => {
  serverOutput += data;
});
child.stderr.on("data", (data) => {
  serverOutput += data;
});

function hiddenInputs(html) {
  html = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0] || "";
  const form = new FormData();
  const decode = (value) =>
    value
      .replaceAll("&quot;", '"')
      .replaceAll("&#x27;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&");
  for (const input of html.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)) {
    const name = input[0].match(/\bname="([^"]+)"/)?.[1];
    const value = input[0].match(/\bvalue="([^"]*)"/)?.[1] || "";
    if (name) form.append(decode(name), decode(value));
  }
  assert.ok(
    [...form.keys()].some((key) => key.startsWith("$ACTION")),
    "SSR form should expose a progressive-enhancement action",
  );
  return form;
}

async function action(path, entries, cookie) {
  const html = await (
    await fetch(`${origin}${path}`, {
      headers: cookie ? { Cookie: cookie } : {},
    })
  ).text();
  const body = hiddenInputs(html);
  for (const [key, value] of Object.entries(entries)) body.set(key, value);
  return fetch(`${origin}${path}`, {
    method: "POST",
    headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
    body,
    redirect: "manual",
  });
}

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Next.js exited early: ${serverOutput}`);
    try {
      if ((await fetch(`${origin}/register`)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (attempt === 99) throw new Error("Next.js did not start");
  }
  const anonymous = await fetch(`${origin}/projects`);
  const anonymousHtml = await anonymous.text();
  assert.ok(
    anonymous.url.includes("/sign-in") ||
      anonymousHtml.includes("url=/sign-in?expired=1"),
    "Anonymous requests must redirect, including streamed meta redirects",
  );
  assert.ok(!anonymousHtml.includes("Session test author"));
  const invalid = await fetch(`${origin}/projects`, {
    headers: { Cookie: "__Host-rawan-session=invalid" },
  });
  const invalidHtml = await invalid.text();
  assert.ok(
    invalid.url.includes("/sign-in") ||
      invalidHtml.includes("url=/sign-in?expired=1"),
    "Invalid tokens must redirect",
  );
  assert.ok(!invalidHtml.includes("Session test author"));
  for (const path of ["/register", "/sign-in"]) {
    const response = await action(path, {
      name: "Session test author",
      email: "test@example.invalid",
      password: "correct test passphrase",
    });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), "/projects");
    const setCookie = response.headers.get("set-cookie");
    assert.match(setCookie, /__Host-rawan-session=/);
    for (const flag of [
      /HttpOnly/i,
      /Secure/i,
      /SameSite=lax/i,
      /Path=\//i,
      /Max-Age=604800/i,
    ])
      assert.match(setCookie, flag);
    const cookie = setCookie.split(";")[0];
    const privateHtml = await (
      await fetch(`${origin}/projects`, { headers: { Cookie: cookie } })
    ).text();
    assert.match(privateHtml, /Session test author/);
    assert.match(privateHtml.replace(/<[^>]*>/g, ""), /No projects yet/);
    assert.ok(
      !privateHtml.includes(token),
      "JWT must not appear in HTML or RSC",
    );
    const logout = await action("/projects", {}, cookie);
    assert.equal(logout.status, 303);
    assert.equal(logout.headers.get("location"), "/sign-in");
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
  }
  const resource = await fetch(`${origin}/projects/not-owned`, {
    headers: { Cookie: `__Host-rawan-session=${token}` },
  });
  assert.match(await resource.text(), /This page isn’t in your story/);
  console.log(
    "Session integration passed: protected routes, invalid token, register/login cookie, no token disclosure, logout, and 404.",
  );
} catch (error) {
  console.error(serverOutput);
  throw error;
} finally {
  child.kill();
  upstream.closeAllConnections();
  await new Promise((resolve) => upstream.close(resolve));
}
