import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  decodeFlow,
  encodeFlow,
} from "../src/features/auth/lib/google-auth.ts";
import {
  decodePopupResult,
  encodePopupResult,
  isPopupId,
} from "../src/features/auth/lib/google-popup.ts";

test("popup completion requires the signed result for that exact attempt", () => {
  const secret = "test-only-secret";
  const popupId = randomUUID();
  const result = { popupId, status: "success", expires: Date.now() + 300000 };
  const encoded = encodePopupResult(result, secret);
  assert.deepEqual(decodePopupResult(encoded, secret, popupId), result);
  assert.equal(decodePopupResult(encoded, "wrong-secret", popupId), null);
  assert.equal(decodePopupResult(encoded, secret, randomUUID()), null);
  assert.equal(decodePopupResult(encoded + ".extra", secret, popupId), null);
  assert.equal(decodePopupResult(encoded + "tampered", secret, popupId), null);
  assert.equal(decodePopupResult(undefined, secret, popupId), null);
  assert.equal(
    decodePopupResult(
      encodePopupResult({ ...result, expires: Date.now() - 1 }, secret),
      secret,
      popupId,
    ),
    null,
  );
  assert.equal(
    decodePopupResult(
      encodePopupResult(
        { ...result, accessToken: "should-never-reach-client" },
        secret,
      ),
      secret,
      popupId,
    ),
    null,
  );
});

test("cancellation and failure remain correlated to the popup without tokens", () => {
  const result = {
    popupId: randomUUID(),
    status: "error",
    error: "cancelled",
    expires: Date.now() + 300000,
  };
  assert.deepEqual(
    decodePopupResult(
      encodePopupResult(result, "secret"),
      "secret",
      result.popupId,
    ),
    result,
  );
  assert.equal(isPopupId("https://example.com"), false);
  assert.equal(isPopupId("<script>alert(1)</script>"), false);
  assert.equal(isPopupId(randomUUID()), true);
});

test("the OAuth transaction signs the popup identifier and rejects malformed identifiers", () => {
  const flow = {
    state: "state",
    nonce: "nonce",
    verifier: "verifier",
    expires: Date.now() + 600000,
    popupId: randomUUID(),
  };
  assert.deepEqual(decodeFlow(encodeFlow(flow, "secret"), "secret"), flow);
  assert.equal(
    decodeFlow(
      encodeFlow({ ...flow, popupId: "external-window" }, "secret"),
      "secret",
    ),
    null,
  );
});
