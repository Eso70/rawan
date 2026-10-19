import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  studioBackgrounds,
  backgroundIdFromResponse,
} from "../src/features/author-desk/backgrounds.ts";

test("all ten seasonal scenes and their thumbnails exist as local WebP assets", async () => {
  assert.ok(studioBackgrounds.length >= 10);
  assert.equal(
    new Set(studioBackgrounds.map((scene) => scene.id)).size,
    studioBackgrounds.length,
  );
  for (const season of ["Spring", "Summer", "Autumn", "Winter"])
    assert.ok(studioBackgrounds.some((scene) => scene.season === season));
  for (const time of ["Dawn", "Noon", "Sunset", "Night"])
    assert.ok(studioBackgrounds.some((scene) => scene.time === time));
  for (const scene of studioBackgrounds) {
    for (const src of [scene.src, scene.thumbnail]) {
      assert.match(src, /^\/assets\/studio\/backgrounds\//);
      const file = new URL("../public" + src, import.meta.url);
      await access(file);
      const bytes = await readFile(file);
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    }
  }
});

test("only backend responses naming a local scene can select a background", () => {
  for (const scene of studioBackgrounds)
    assert.equal(
      backgroundIdFromResponse({ backgroundId: scene.id }),
      scene.id,
    );
  for (const value of [
    null,
    "",
    "atmosphere",
    "https://external.invalid/image.jpg",
    "../../file",
    "removed-scene",
  ])
    assert.equal(backgroundIdFromResponse(value), null);
  assert.equal(backgroundIdFromResponse({ backgroundId: "../../file" }), null);
  assert.equal(
    backgroundIdFromResponse({ backgroundId: "https://external.invalid/file" }),
    null,
  );
});
