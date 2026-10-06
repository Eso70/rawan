import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeFlow, decodeFlow, authConfig } from "../src/lib/google-auth.ts";

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
test("configuration rejects non-local destinations", () => {
  const previous = process.env.AUTH_ORIGIN;
  process.env.AUTH_ORIGIN = "https://example.com";
  assert.throws(() => authConfig());
  if (previous === undefined) delete process.env.AUTH_ORIGIN;
  else process.env.AUTH_ORIGIN = previous;
});
