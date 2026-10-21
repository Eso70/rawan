export type BookCoverStyle = { layout: "arch" | "editorial" | "orbit"; color: string; finish: "linen" | "matte"; thickness: number };
export const defaultCoverStyle: BookCoverStyle = { layout: "arch", color: "#356b65", finish: "linen", thickness: 0.24 };
export const coverColors = [
  { value: "#356b65", label: "Jade" }, { value: "#ac634d", label: "Terracotta" },
  { value: "#73577c", label: "Plum" }, { value: "#364c70", label: "Ink blue" },
  { value: "#bca774", label: "Sand" },
];
