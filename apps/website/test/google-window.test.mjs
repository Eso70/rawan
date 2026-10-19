import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import {
  googlePopupId,
  googleStartUrl,
  openGoogleWindow,
} from "../src/features/auth/lib/google-window.ts";
import { isPopupId } from "../src/features/auth/lib/google-popup.ts";

test("older browsers without randomUUID still create secure attempt IDs", () => {
  const source = {
    getRandomValues: (array) => webcrypto.getRandomValues(array),
  };
  const first = googlePopupId(source);
  assert.equal(isPopupId(first), true);
  assert.notEqual(first, googlePopupId(source));
});
test("Google opens directly from the click with a safe destination and isolated opener", () => {
  let focused = false;
  const popup = {
    opener: {},
    focus: () => {
      focused = true;
    },
  };
  const browser = {
    outerWidth: 1200,
    outerHeight: 900,
    screenX: 0,
    screenY: 0,
    open: (url, name, features) => {
      assert.equal(url, "/auth/google?returnTo=%2Freader&popupId=test-id");
      assert.equal(name, "rawan-google-test-id");
      assert.match(features, /popup=yes/);
      return popup;
    },
    location: { assign: () => assert.fail("Popup available") },
  };
  assert.equal(openGoogleWindow(browser, "/reader", "test-id"), popup);
  assert.equal(popup.opener, null);
  assert.equal(focused, true);
});
test("blocked or unsupported popups automatically use ordinary OAuth in the current tab", () => {
  for (const open of [
    () => null,
    () => {
      throw Error("Unsupported");
    },
  ]) {
    let destination;
    const browser = {
      outerWidth: 375,
      outerHeight: 700,
      screenX: 0,
      screenY: 0,
      open,
      location: {
        assign: (value) => {
          destination = value;
        },
      },
    };
    assert.equal(openGoogleWindow(browser, "/reader", "test-id"), null);
    assert.equal(destination, "/auth/google?returnTo=%2Freader");
    assert.equal(
      new URL(destination, "http://localhost:3000").searchParams.has("popupId"),
      false,
    );
  }
  assert.equal(
    googleStartUrl("https://evil.test"),
    "/auth/google?returnTo=%2Faccount",
  );
});
