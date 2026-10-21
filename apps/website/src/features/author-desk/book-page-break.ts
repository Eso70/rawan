import { Node } from "@tiptap/core";

export const BookPageBreak = Node.create({
  name: "bookPageBreak",
  group: "block",
  atom: true,
  parseHTML: () => [{ tag: "div[data-book-page-break]" }],
  renderHTML: () => [
    "div",
    { "data-book-page-break": "", "aria-label": "Page break" },
  ],
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () =>
        this.editor
          .chain()
          .insertContent([{ type: "bookPageBreak" }, { type: "paragraph" }])
          .run(),
    };
  },
});
