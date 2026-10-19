import assert from "node:assert/strict";
import { test } from "node:test";
import {
  safeReturnTo,
  loginUrl,
  onboardingUrl,
  experienceDestination,
} from "../src/features/onboarding/routing.ts";
import { hasSetupAccess } from "@rawan/types/onboarding";
test("existing accounts bypass setup and new accounts require completion without age checks", () => {
  for (const status of ["not_started", "in_progress", "completed"]) {
    assert.equal(hasSetupAccess({ required: false, status }), true);
    assert.equal(
      hasSetupAccess({ required: true, status }),
      status === "completed",
    );
  }
});
test("return paths preserve existing destinations and reject external, encoded, unknown and looping targets", () => {
  for (const value of ["/account", "/studio", "/reader"]) {
    assert.equal(safeReturnTo(value), value);
    assert.equal(
      loginUrl(value),
      "/login?returnTo=" + encodeURIComponent(value),
    );
    assert.equal(
      onboardingUrl(value),
      "/onboarding?returnTo=" + encodeURIComponent(value),
    );
  }
  for (const value of [
    null,
    undefined,
    ["/workspace/reader"],
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2f%2fevil.test",
    "/workspace%2freader",
    "/onboarding",
    "/login",
    "/workspace?returnTo=//evil.test",
    "/workspace\n",
    "javascript:alert(1)",
  ])
    assert.equal(safeReturnTo(value), "/account");
});

test("legacy workspace URLs resolve to real destinations", () => {
  assert.equal(safeReturnTo("/workspace"), "/account");
  assert.equal(safeReturnTo("/workspace/reader"), "/reader");
  assert.equal(safeReturnTo("/workspace/reader#shelf"), "/reader#shelf");
});

test("purpose chooses the dashboard even when an older starting preference conflicts", () => {
  for (const purpose of [null, "create", "read", "both"]) {
    assert.equal(
      experienceDestination({ purpose, preferredStart: "studio" }),
      purpose === "read" ? "/reader" : "/studio",
    );
    assert.equal(
      experienceDestination({ purpose, preferredStart: "reader" }),
      purpose === "read" ? "/reader" : "/studio",
    );
    assert.equal(
      experienceDestination({ purpose, preferredStart: null }),
      purpose === "read" ? "/reader" : "/studio",
    );
  }
});

test("explicit experience links survive setup without external redirects or loops", () => {
  const writer = { purpose: "create", preferredStart: "studio" };
  const reader = { purpose: "read", preferredStart: "reader" };
  assert.equal(experienceDestination(writer, "/reader"), "/reader");
  assert.equal(experienceDestination(reader, "/studio"), "/studio");
  assert.equal(experienceDestination(writer, "/workspace/reader"), "/reader");
  assert.equal(experienceDestination(reader, "/workspace"), "/reader");
  assert.equal(experienceDestination(reader, "//evil.test"), "/reader");
  assert.equal(
    experienceDestination(writer, "/account#projects"),
    "/studio#projects",
  );
});
