export type BookDesign = {
  face: string;
  size: string;
  spacing: string;
  width: string;
  page: boolean;
  trim: string;
  orientation: "portrait" | "landscape";
  top: number;
  bottom: number;
  inside: number;
  outside: number;
  gutter: number;
  paragraphGap: number;
  indent: number;
  tracking: number;
  direction: "ltr" | "rtl";
  hyphens: boolean;
  dropCap: boolean;
  runningHeads: boolean;
  folios: boolean;
  chapterStart: "next" | "recto";
  paper: "ivory" | "white";
  language: string;
  pageZoom: string;
  paperColor?: string;
  previewPaper?: "theme" | "print";
  titlePage: boolean;
  contents: boolean;
};

export const defaultBookDesign: BookDesign = {
  face: "Rawan Lora",
  size: "12",
  spacing: "1.8",
  width: "680",
  page: false,
  trim: "trade",
  orientation: "portrait",
  top: 20,
  bottom: 20,
  inside: 20,
  outside: 16,
  gutter: 4,
  paragraphGap: 8,
  indent: 0,
  tracking: 0,
  direction: "ltr",
  hyphens: true,
  dropCap: false,
  runningHeads: true,
  folios: true,
  chapterStart: "next",
  paper: "white",
  paperColor: "#ffffff",
  previewPaper: "theme",
  language: "en",
  titlePage: false,
  contents: false,
  pageZoom: "fit",
};
/** Printing always uses the chosen stock color; the desk theme only affects its screen preview. */
export function paperAppearance(
  design: BookDesign,
  theme: "dark" | "light",
  printing = false,
) {
  const chosen = /^#[0-9a-f]{6}$/i.test(design.paperColor ?? "")
    ? design.paperColor!
    : design.paper === "ivory"
      ? "#f5f0e5"
      : "#ffffff";
  const paper =
    printing || design.previewPaper === "print"
      ? chosen
      : theme === "dark"
        ? "#182b3d"
        : "#ffffff";
  const channels = [1, 3, 5]
    .map((index) => parseInt(paper.slice(index, index + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  const dark =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 < 0.35;
  return {
    paper,
    ink: dark ? "#e4edf5" : "#252b33",
    runningInk: dark ? "#bdcede" : "#54606a",
  };
}
export const trimSizes = [
  { value: "pocket", label: "Pocket · 5 × 8 in", width: 127, height: 203.2 },
  {
    value: "digest",
    label: "Digest · 5.5 × 8.5 in",
    width: 139.7,
    height: 215.9,
  },
  { value: "trade", label: "Trade · 6 × 9 in", width: 152.4, height: 228.6 },
  { value: "a5", label: "A5 · 148 × 210 mm", width: 148, height: 210 },
  { value: "a4", label: "A4 · 210 × 297 mm", width: 210, height: 297 },
  {
    value: "letter",
    label: "Letter · 8.5 × 11 in",
    width: 215.9,
    height: 279.4,
  },
] as const;
export function pageDimensions(design: BookDesign) {
  const trim =
    trimSizes.find((item) => item.value === design.trim) ?? trimSizes[2];
  return design.orientation === "landscape"
    ? { width: trim.height, height: trim.width }
    : { width: trim.width, height: trim.height };
}
export function cssFont(family: string) {
  return `"${family
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replace(/[\r\n<>]/g, "")}", serif`;
}
