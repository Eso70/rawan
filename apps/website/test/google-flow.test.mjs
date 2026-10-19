import { test } from "node:test";
import assert from "node:assert/strict";
import {
  googleApiError,
  loginErrors,
} from "../src/features/auth/lib/login-errors.ts";
import {
  encodeFlow,
  decodeFlow,
  authConfig,
  appConfig,
} from "../src/features/auth/lib/google-auth.ts";

test("Google API outages give a server/session error without weakening account protections", () => {
  for (const status of [500, 502, 503, 504]) {
    assert.equal(googleApiError(status), "session");
    assert.match(loginErrors[googleApiError(status)], /server is unavailable/);
  }
  assert.equal(googleApiError(409), "linking");
  assert.equal(googleApiError(429), "limit");
  for (const status of [400, 401, 403])
    assert.equal(googleApiError(status), "google");
});

test("OAuth transaction rejects tampering, expired cookies and missing cookies", () => {
  const secret = "test-only-secret";
  const flow = {
    state: "random-state",
    nonce: "random-nonce",
    verifier: "pkce-verifier",
    expires: Date.now() + 600000,
  };
  const encoded = encodeFlow(flow, secret);
  assert.deepEqual(decodeFlow(encoded, secret), flow);
  assert.equal(decodeFlow(encoded, "different-secret"), null);
  assert.equal(decodeFlow(encoded + "tampered", secret), null);
  assert.equal(decodeFlow(undefined, secret), null);
  assert.equal(
    decodeFlow(
      encodeFlow({ ...flow, expires: Date.now() - 1000 }, secret),
      secret,
    ),
    null,
  );
});
test("email sessions do not require Google credentials", () => {
  const keys = [
    "AUTH_ORIGIN",
    "RAWAN_API_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    process.env.AUTH_ORIGIN = "http://localhost:3000";
    process.env.RAWAN_API_URL = "http://127.0.0.1:3002/api/v1";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    assert.deepEqual(appConfig(), {
      origin: "http://localhost:3000",
      api: "http://127.0.0.1:3002/api/v1",
    });
    assert.throws(() => authConfig());
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
test("same-tab OAuth retains only safe destinations in its signed transaction", () => {
  const secret = "test-only-secret";
  const flow = {
    state: "state",
    nonce: "nonce",
    verifier: "pkce",
    expires: Date.now() + 600000,
    returnTo: "/reader",
  };
  assert.equal(
    decodeFlow(encodeFlow(flow, secret), secret).returnTo,
    "/reader",
  );
  for (const returnTo of [
    "https://evil.test",
    "//evil.test",
    "/onboarding",
    ["/studio"],
  ])
    assert.equal(
      decodeFlow(encodeFlow({ ...flow, returnTo }, secret), secret),
      null,
    );
  assert.equal(decodeFlow(encodeFlow(flow, secret) + ".extra", secret), null);
  assert.equal(
    decodeFlow(encodeFlow({ ...flow, expires: null }, secret), secret),
    null,
  );
});
test("configuration rejects non-local destinations", () => {
  const previous = process.env.AUTH_ORIGIN;
  process.env.AUTH_ORIGIN = "https://example.com";
  assert.throws(() => authConfig());
  if (previous === undefined) delete process.env.AUTH_ORIGIN;
  else process.env.AUTH_ORIGIN = previous;
});
