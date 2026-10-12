import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { unzipSync, strFromU8 } from "fflate";
import { Readable } from "node:stream";
import {
  readBounded,
  renderArtwork,
  renderExport,
  type ExportSnapshot,
} from "./processing.js";
describe("Bounded artwork and prose preparation", () => {
  it("normalizes orientation, strips source metadata and never enlarges images", async () => {
    const original = await sharp({
      create: { width: 32, height: 64, channels: 3, background: "#124578" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const renditions = await renderArtwork(original);
    expect(renditions).toHaveLength(3);
    for (const rendition of renditions) {
      const metadata = await sharp(rendition.bytes).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(64);
      expect(metadata.height).toBe(32);
      expect(metadata.exif).toBeUndefined();
      expect(metadata.orientation).toBeUndefined();
    }
  });
  it("rejects unsupported artwork and excessive streams", async () => {
    await expect(
      renderArtwork(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>',
        ),
      ),
    ).rejects.toThrow();
    await expect(
      readBounded(Readable.from([Buffer.alloc(10), Buffer.alloc(10)]), 15),
    ).rejects.toThrow("ARTIFACT_SIZE_LIMIT");
  });
  const snapshot: ExportSnapshot = {
    title: "Title <script>",
    language: "en",
    authors: ["A & B"],
    sections: [
      {
        title: "Opening",
        blocks: [
          {
            kind: "PARAGRAPH",
            text: "<img src=x onerror=alert(1)>",
            referenceLabel: "note1",
          },
        ],
      },
      {
        title: "Notes",
        blocks: [
          { kind: "FOOTNOTE", text: "Reference text", footnoteLabel: "note1" },
        ],
      },
    ],
  };
  it("escapes HTML while preserving plain TXT source text", () => {
    const html = renderExport(snapshot, "HTML", "test").bytes.toString();
    expect(html).not.toContain("<img src=");
    expect(html).toContain("&lt;img");
    expect(renderExport(snapshot, "TXT", "test").bytes.toString()).toContain(
      "<img src=x",
    );
  });
  it("builds a navigable EPUB with stored-first mimetype and cross-section footnotes", () => {
    const bytes = renderExport(snapshot, "EPUB", "test").bytes;
    expect(bytes.readUInt16LE(8)).toBe(0);
    expect(bytes.subarray(30, 38).toString()).toBe("mimetype");
    const files = unzipSync(bytes);
    expect(strFromU8(files.mimetype!)).toBe("application/epub+zip");
    expect(strFromU8(files["EPUB/section-0.xhtml"]!)).toContain(
      'href="section-1.xhtml#note-note1"',
    );
    expect(strFromU8(files["EPUB/section-1.xhtml"]!)).toContain(
      'id="note-note1"',
    );
    expect(strFromU8(files["EPUB/package.opf"]!)).toContain(
      '<itemref idref="s1"/>',
    );
    expect(strFromU8(files["EPUB/nav.xhtml"]!)).toContain("section-1.xhtml");
  });
});
