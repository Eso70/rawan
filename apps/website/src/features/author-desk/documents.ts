export const documentKinds = [
  "Book",
  "Comic",
  "Character",
  "Outline",
  "Note",
  "Place",
] as const;
export type DocumentKind = (typeof documentKinds)[number];
export type DeskDocument = {
  id: string;
  kind: DocumentKind;
  title: string;
  text: string;
  role: string;
};
export const DESK_KEY = "rawan-author-desk-v1";

export function readDocuments(raw: string | null): DeskDocument[] {
  if (!raw) return [];
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    data.length > 100 ||
    data.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        typeof item.id !== "string" ||
        item.id.length > 100 ||
        !documentKinds.includes(item.kind) ||
        typeof item.title !== "string" ||
        item.title.length > 100 ||
        typeof item.text !== "string" ||
        item.text.length > 200000 ||
        typeof item.role !== "string" ||
        item.role.length > 200,
    ) ||
    new Set(data.map((item) => item.id)).size !== data.length
  )
    throw Error("Invalid saved documents");
  return data as DeskDocument[];
}
