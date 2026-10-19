import assert from "node:assert/strict";
import { test } from "node:test";
import { readDocuments } from "../src/features/author-desk/documents.ts";

test("the new author space starts empty and restores each supported document kind", () => {
  assert.deepEqual(readDocuments(null), []);
  const documents = [
    "Book",
    "Comic",
    "Character",
    "Outline",
    "Note",
    "Place",
  ].map((kind, index) => ({
    id: String(index),
    kind,
    title: "My writing",
    text: "A first line.",
    role: kind === "Character" ? "Protagonist" : "",
  }));
  assert.deepEqual(readDocuments(JSON.stringify(documents)), documents);
});

test("incompatible or corrupt drafts are rejected so they cannot be overwritten as empty", () => {
  const item = {
    id: "1",
    kind: "Book",
    title: "Title",
    text: "Draft",
    role: "",
  };
  for (const raw of [
    "broken",
    "null",
    "{}",
    JSON.stringify([item, item]),
    JSON.stringify([{ ...item, kind: "Unknown" }]),
    JSON.stringify([{ ...item, text: {} }]),
    JSON.stringify([{ ...item, title: "x".repeat(101) }]),
  ])
    assert.throws(() => readDocuments(raw));
});
