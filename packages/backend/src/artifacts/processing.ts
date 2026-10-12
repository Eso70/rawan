import sharp from "sharp";
import { strToU8, zipSync } from "fflate";
import type { Readable } from "node:stream";

export const ARTIFACT_LIMIT = 10 * 1024 * 1024;
export async function readBounded(
  stream: Readable,
  limit = ARTIFACT_LIMIT,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of stream) {
      const bytes = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk as Uint8Array);
      size += bytes.length;
      if (size > limit) throw new Error("ARTIFACT_SIZE_LIMIT");
      chunks.push(bytes);
    }
    return Buffer.concat(chunks);
  } finally {
    stream.destroy();
  }
}
export async function renderArtwork(bytes: Buffer) {
  const options = { limitInputPixels: 32_000_000, failOn: "warning" as const };
  const metadata = await sharp(bytes, options).metadata();
  if (
    !["png", "jpeg", "webp"].includes(metadata.format ?? "") ||
    (metadata.pages ?? 1) !== 1 ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > 16000 ||
    metadata.height > 16000
  )
    throw new Error("INVALID_ARTWORK");
  const results = [];
  for (const [role, size, quality] of [
    ["FULL", 16000, 95],
    ["DISPLAY", 1600, 90],
    ["THUMBNAIL", 320, 80],
  ] as const) {
    const { data, info } = await sharp(bytes, options)
      .autoOrient()
      .resize({
        width: size,
        height: size,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .timeout({ seconds: 20 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > ARTIFACT_LIMIT) throw new Error("ARTIFACT_SIZE_LIMIT");
    results.push({
      role,
      bytes: data,
      width: info.width,
      height: info.height,
      mimeType: "image/webp",
    });
  }
  return results;
}
export interface ExportSnapshot {
  title: string;
  language: string;
  authors: string[];
  sections: {
    title: string;
    blocks: {
      kind: string;
      text: string;
      footnoteLabel?: string | null;
      referenceLabel?: string | null;
    }[];
  }[];
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!,
  );
const blockHtml = (
  block: ExportSnapshot["sections"][number]["blocks"][number],
  references?: Map<string, string>,
) => {
  const text = escape(block.text).replaceAll("\n", "<br/>");
  const reference = block.referenceLabel
    ? ` <a href="${escape(references?.get(block.referenceLabel) ?? "")}#note-${escape(block.referenceLabel)}">[${escape(block.referenceLabel)}]</a>`
    : "";
  if (block.kind === "FOOTNOTE")
    return `<aside id="note-${escape(block.footnoteLabel ?? "")}">${text}</aside>`;
  if (block.kind === "HEADING") return `<h2>${text}</h2>`;
  if (block.kind === "CODE") return `<pre>${escape(block.text)}</pre>`;
  if (block.kind === "QUOTE")
    return `<blockquote>${text}${reference}</blockquote>`;
  return `<p>${text}${reference}</p>`;
};
export function renderExport(
  snapshot: ExportSnapshot,
  format: "TXT" | "HTML" | "EPUB",
  id: string,
) {
  const sections = snapshot.sections;
  const title = escape(snapshot.title),
    language = escape(snapshot.language);
  const xhtml = (heading: string, content: string) =>
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}" xml:lang="${language}"><head><title>${escape(heading)}</title><meta charset="UTF-8"/></head><body>${content}</body></html>`;
  if (format === "TXT")
    return {
      bytes: Buffer.from(
        [
          snapshot.title,
          snapshot.authors.join(", "),
          ...sections.map(
            (section) =>
              `${section.title}\n\n${section.blocks.map((block) => block.text).join("\n\n")}`,
          ),
        ].join("\n\n"),
      ),
      mimeType: "text/plain",
      extension: "txt",
    };
  if (format === "HTML")
    return {
      bytes: Buffer.from(
        `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${sections.map((section) => `<section><h2>${escape(section.title)}</h2>${section.blocks.map((block) => blockHtml(block)).join("")}</section>`).join("")}</body></html>`,
      ),
      mimeType: "text/html",
      extension: "html",
    };
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    mimetype: [strToU8("application/epub+zip"), { level: 0 }],
    "META-INF/container.xml": strToU8(
      '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>',
    ),
  };
  files["EPUB/nav.xhtml"] = strToU8(
    xhtml(
      snapshot.title,
      `<nav epub:type="toc"><h1>Contents</h1><ol>${sections.map((section, i) => `<li><a href="section-${i}.xhtml">${escape(section.title)}</a></li>`).join("")}</ol></nav>`,
    ),
  );
  const references = new Map<string, string>();
  for (const [i, section] of sections.entries())
    for (const block of section.blocks)
      if (block.footnoteLabel)
        references.set(block.footnoteLabel, `section-${i}.xhtml`);
  for (const [i, section] of sections.entries())
    files[`EPUB/section-${i}.xhtml`] = strToU8(
      xhtml(
        section.title,
        `<h1>${escape(section.title)}</h1>${section.blocks.map((block) => blockHtml(block, references)).join("")}`,
      ),
    );
  files["EPUB/package.opf"] = strToU8(
    `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="publication-id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="publication-id">urn:uuid:${escape(id)}</dc:identifier><dc:title>${title}</dc:title><dc:language>${language}</dc:language>${snapshot.authors.map((author) => `<dc:creator>${escape(author)}</dc:creator>`).join("")}<meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${sections.map((_, i) => `<item id="s${i}" href="section-${i}.xhtml" media-type="application/xhtml+xml"/>`).join("")}</manifest><spine>${sections.map((_, i) => `<itemref idref="s${i}"/>`).join("")}</spine></package>`,
  );
  return {
    bytes: Buffer.from(zipSync(files)),
    mimeType: "application/epub+zip",
    extension: "epub",
  };
}
