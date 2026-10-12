import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeFlow,
  decodeFlow,
  authConfig,
  appConfig,
} from "../src/lib/google-auth.ts";

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
test("configuration rejects non-local destinations", () => {
  const previous = process.env.AUTH_ORIGIN;
  process.env.AUTH_ORIGIN = "https://example.com";
  assert.throws(() => authConfig());
  if (previous === undefined) delete process.env.AUTH_ORIGIN;
  else process.env.AUTH_ORIGIN = previous;
});
