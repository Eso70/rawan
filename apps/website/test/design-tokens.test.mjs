import assert from "node:assert/strict";
import { test } from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

test("shared style variables resolve and the registry contains only consumed tokens", async () => {
  const root = fileURLToPath(new URL("../src/", import.meta.url));
  const registry = await readFile(join(root, "styles/tokens.css"), "utf8");
  const defined = new Set(
    [...registry.matchAll(/(--[\w-]+):/g)].map((m) => m[1]),
  );
  const sources = await Promise.all(
    (await readdir(root, { recursive: true }))
      .filter((name) => name.endsWith(".css"))
      .map((name) => readFile(join(root, name), "utf8")),
  );
  const used = new Set(
    sources.flatMap((css) =>
      [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]),
    ),
  );
  for (const name of used) {
    if (
      /^--(color|white|black|font|space|radius|text|weight|leading|tracking|layer|duration|shadow|border)-/.test(
        name,
      )
    )
      assert.ok(defined.has(name), "Undefined shared style token: " + name);
  }
  for (const name of defined)
    assert.ok(used.has(name), "Unused shared style token: " + name);
});
