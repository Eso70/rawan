import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBookDesign, pageDimensions, trimSizes, cssFont, paperAppearance } from "../src/features/author-desk/book-design.ts";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

test("book sizes retain physical dimensions when changing orientation", () => {
  for (const trim of trimSizes) {
    const portrait = pageDimensions({ ...defaultBookDesign, trim: trim.value });
    const landscape = pageDimensions({ ...defaultBookDesign, trim: trim.value, orientation: "landscape" });
    assert.deepEqual(portrait, { width: trim.width, height: trim.height });
    assert.deepEqual(landscape, { width: trim.height, height: trim.width });
    assert.ok(portrait.width - 35 - 35 - 15 > 0);
    assert.ok(portrait.height - 35 - 35 > 0);
  }
});
test("unrecognized paper presets fall back to the default trade book", () => {
  assert.deepEqual(pageDimensions({ ...defaultBookDesign, trim: "unknown" }), { width: 152.4, height: 228.6 });
});
test("uploaded font labels cannot terminate the generated CSS family", () => {
  assert.equal(cssFont('A "quoted" font'), '"A \\"quoted\\" font", serif');
  assert.ok(!/[<>\r\n]/.test(cssFont('</style>\n<script>')));
});
test("the locally served pagination engine matches the installed library", () => {
  const require = createRequire(import.meta.url);
  const installed = readFileSync(resolve(dirname(require.resolve("pagedjs")), "../dist/paged.polyfill.min.js"));
  const served = readFileSync(new URL("../public/vendor/pagedjs/paged.polyfill.min.js", import.meta.url));
  const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
  assert.equal(hash(served), hash(installed));
});


test("printing retains custom paper color independently of the desk theme", () => {
  const design={...defaultBookDesign,paperColor:"#fff4d6",previewPaper:"theme"};
  assert.deepEqual(paperAppearance(design,"dark",true),paperAppearance(design,"light",true));
  assert.equal(paperAppearance(design,"dark",true).paper,"#fff4d6");
  assert.notEqual(paperAppearance(design,"dark").paper,paperAppearance(design,"light").paper);
});
test("print-color preview stays stable across theme changes and preserves contrast",()=>{
  for(const paperColor of ["#000000","#ffffff","#123456","#fff4d6"]){
    const design={...defaultBookDesign,paperColor,previewPaper:"print"};
    assert.deepEqual(paperAppearance(design,"dark"),paperAppearance(design,"light"));
    assert.equal(paperAppearance(design,"dark").paper,paperColor);
    assert.notEqual(paperAppearance(design,"dark").ink,paperColor);
  }
});
test("invalid paper values cannot inject CSS and legacy stock colors still resolve",()=>{
  assert.equal(paperAppearance({...defaultBookDesign,paperColor:"red;}body{display:none",previewPaper:"print"},"light").paper,"#ffffff");
  assert.equal(paperAppearance({...defaultBookDesign,paper:"ivory",paperColor:undefined},"dark",true).paper,"#f5f0e5");
});
