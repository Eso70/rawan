// Design-preview data only. No backend or browser-storage persistence.
import type { BookDesign } from "./book-design";
import type { BookCoverStyle } from "./book-cover-style";
export type PreviewChapter = {
  id: string;
  title: string;
  html: string;
  words: number;
  headerImage?: string | null;
};

export type PreviewBook = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  covers: BookCovers;
  chapters: PreviewChapter[];
  design?: BookDesign;
  coverStyle?: BookCoverStyle;
};

export type CoverSide = "front" | "back" | "spine";
export type BookCovers = Record<CoverSide, string | null>;
export type BookDetails = Pick<PreviewBook, "title" | "subtitle" | "type" | "covers" | "coverStyle">;

export const bookTypes = ["Novel", "Novella", "Short story", "Nonfiction", "Poetry", "Other"] as const;
