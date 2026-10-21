import assert from "node:assert/strict";
import { test } from "node:test";
import { textChange } from "../src/features/author-desk/book-text-change.ts";

for (const [name, before, after] of [
  ["append while typing", "The story", "The story begins"],
  ["insert inside a split paragraph", "first page second page", "first page new second page"],
  ["delete across a page boundary", "first page second page", "first page"],
  ["replace a selection", "The old story", "The new story"],
  ["Arabic and emoji edits", "\u0628\u062f\u0627\u064a\u0629 \ud83c\udf19", "\u0628\u062f\u0627\u064a\u0629 \u2600\ufe0f"],
  ["empty paragraph", "", "First word"],
  ["clear a paragraph", "First word", ""],
  ["unchanged formatting text", "A story", "A story"],
]) {
  test(`live preview text mapping: ${name}`, () => {
    const delta = textChange(before, after);
    assert.equal(before.slice(0, delta.start) + delta.replacement + before.slice(delta.endBefore), after);
    assert.ok(delta.start >= 0 && delta.endBefore >= delta.start && delta.endBefore <= before.length);
  });
}
