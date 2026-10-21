"use client";

import { StudioButton } from "../../components/ui/tooltip";

import { useRef, useState, type CSSProperties } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/literata";
import "@fontsource-variable/noto-naskh-arabic";
import { BookPageBreak } from "./book-page-break";
import { DesignRibbonTools, fontSizes } from "./book-ribbon-design";
import { BookPrintView, type PaginationInfo } from "./book-print-view";
import { useFontLibrary } from "./use-font-library";
import {
  cssFont,
  defaultBookDesign,
  pageDimensions,
  type BookDesign,
} from "./book-design";
import { Dropdown } from "../../components/ui/dropdown";
import { FormInput as TextInput } from "../../components/ui/form-input";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconList,
  IconListNumbers,
  IconQuote,
  IconSeparator,
  IconPlus,
  IconBook2,
  IconChevronRight,
  IconFeather,
  IconFocus2,
  IconPhotoPlus,
  IconTrash,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconHighlight,
  IconSubscript,
  IconSuperscript,
  IconClearFormatting,
  IconFileTypography,
} from "@tabler/icons-react";
import type { PreviewBook, PreviewChapter } from "./book-preview";
import styles from "./book-workspace.module.css";
import { BookRibbon, RibbonGroup, RibbonRow } from "./book-ribbon";

function Manuscript({
  chapter,
  book,
  onChange,
  onRename,
  onHeaderImageChange,
  appearance,
  onAppearanceChange,
  fonts,
  onTypeset,
  previewOpen,
  onTogglePreview,
  pageInfo,
}: {
  chapter: PreviewChapter;
  book: PreviewBook;
  onChange: (html: string, words: number) => void;
  onRename: (title: string) => void;
  onHeaderImageChange: (image: string | null) => void;
  appearance: BookDesign;
  onAppearanceChange: (appearance: BookDesign) => void;
  fonts: ReturnType<typeof useFontLibrary>;
  onTypeset: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  pageInfo: PaginationInfo;
}) {
  const [focusMode, setFocusMode] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const inlineImage = useRef<HTMLInputElement>(null);
  const [insertError, setInsertError] = useState("");
  const [insertingImage, setInsertingImage] = useState(false);
  const [, refresh] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      TableKit.configure({ table: { resizable: true } }),
      Image.configure({
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ["bottom-right", "bottom-left"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Subscript,
      Superscript,
      BookPageBreak,
    ],
    content: chapter.html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.prose,
        role: "textbox",
        "aria-label": "Manuscript",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: current }) => {
      const text = current.getText().trim();
      onChange(current.getHTML(), text ? text.split(/\s+/).length : 0);
      refresh((value) => value + 1);
    },
    onSelectionUpdate: () => refresh((value) => value + 1),
    onTransaction: () => refresh((value) => value + 1),
  });
  const controls = [
    {
      label: "Undo",
      Icon: IconArrowBackUp,
      action: () => editor?.chain().focus().undo().run(),
      disabled: !editor?.can().undo(),
    },
    {
      label: "Redo",
      Icon: IconArrowForwardUp,
      action: () => editor?.chain().focus().redo().run(),
      disabled: !editor?.can().redo(),
    },
    {
      label: "Bold",
      Icon: IconBold,
      action: () => editor?.chain().focus().toggleBold().run(),
      active: editor?.isActive("bold"),
    },
    {
      label: "Italic",
      Icon: IconItalic,
      action: () => editor?.chain().focus().toggleItalic().run(),
      active: editor?.isActive("italic"),
    },
    {
      label: "Underline",
      Icon: IconUnderline,
      action: () => editor?.chain().focus().toggleUnderline().run(),
      active: editor?.isActive("underline"),
    },
    {
      label: "Strikethrough",
      Icon: IconStrikethrough,
      action: () => editor?.chain().focus().toggleStrike().run(),
      active: editor?.isActive("strike"),
    },
    {
      label: "Bullet list",
      Icon: IconList,
      action: () => editor?.chain().focus().toggleBulletList().run(),
      active: editor?.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      Icon: IconListNumbers,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      active: editor?.isActive("orderedList"),
    },
    {
      label: "Block quote",
      Icon: IconQuote,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      active: editor?.isActive("blockquote"),
    },
    {
      label: "Scene break",
      Icon: IconSeparator,
      action: () => editor?.chain().focus().setHorizontalRule().run(),
    },
    {
      label: "Highlight",
      Icon: IconHighlight,
      action: () =>
        editor?.chain().focus().toggleHighlight({ color: "#f0d88b" }).run(),
      active: editor?.isActive("highlight"),
    },
    {
      label: "Subscript",
      Icon: IconSubscript,
      action: () => editor?.chain().focus().toggleSubscript().run(),
      active: editor?.isActive("subscript"),
    },
    {
      label: "Superscript",
      Icon: IconSuperscript,
      action: () => editor?.chain().focus().toggleSuperscript().run(),
      active: editor?.isActive("superscript"),
    },
    {
      label: "Clear text formatting",
      Icon: IconClearFormatting,
      action: () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ];
  const updateDesign = <K extends keyof BookDesign>(
    key: K,
    value: BookDesign[K],
  ) => onAppearanceChange({ ...appearance, [key]: value });
  const renderControls = (labels: string[]) =>
    controls
      .filter((control) => labels.includes(control.label))
      .map(({ label, Icon, action, active, disabled }) => (
        <StudioButton
          key={label}
          aria-label={label}
          aria-pressed={active}
          disabled={disabled || !editor}
          onClick={action}
        >
          <Icon size={16} stroke={1.7} />
        </StudioButton>
      ));
  const alignments = [
    { value: "left", Icon: IconAlignLeft },
    { value: "center", Icon: IconAlignCenter },
    { value: "right", Icon: IconAlignRight },
    { value: "justify", Icon: IconAlignJustified },
  ].map(({ value, Icon }) => (
    <StudioButton
      key={value}
      aria-label={`Align ${value}`}
      aria-pressed={editor?.isActive({ textAlign: value }) ?? false}
      disabled={!editor}
      onClick={() => editor?.chain().focus().setTextAlign(value).run()}
    >
      <Icon size={16} />
    </StudioButton>
  ));
  const paper = pageDimensions(appearance);
  const surfaceStyle = {
    "--writing-face": cssFont(appearance.face),
    "--writing-size": `${appearance.size}pt`,
    "--writing-spacing": appearance.spacing,
    "--writing-width": `${appearance.width}px`,
    "--paragraph-gap": `${appearance.paragraphGap}pt`,
    "--first-indent": `${appearance.indent}mm`,
    "--letter-spacing": `${appearance.tracking}px`,
    "--paper-width": `${paper.width}mm`,
    "--paper-height": `${paper.height}mm`,
    "--margin-top": `${appearance.top}mm`,
    "--margin-bottom": `${appearance.bottom}mm`,
    "--margin-inside": `${appearance.inside + appearance.gutter}mm`,
    "--margin-outside": `${appearance.outside}mm`,
    "--page-zoom": appearance.pageZoom ?? "1",
    "--paper-color": appearance.paper === "white" ? "#fff" : "#f5f0e5",
  } as CSSProperties;

  return (
    <div className={styles.writerLayout} data-preview-open={previewOpen}>
      <div
        className={`${styles.manuscript} ${focusMode ? styles.focusMode : ""} ${appearance.dropCap ? styles.dropCap : ""}`}
        style={surfaceStyle}
      >
        <div className={styles.writerTop}>
          <div className={styles.quickAccess}>
            {renderControls(["Undo", "Redo"])}
          </div>
          <span>{book.title}</span>
          <div>
            <StudioButton
              className={styles.bookViewButton}
              tooltip="View your book as paginated pages"
              onClick={onTypeset}
            >
              <IconFileTypography size={15} />
              Book view
            </StudioButton>
            <StudioButton
              title={focusMode ? "Leave focus view" : "Focus view"}
              aria-label={focusMode ? "Leave focus view" : "Focus view"}
              aria-pressed={focusMode}
              onClick={() => setFocusMode(!focusMode)}
            >
              <IconFocus2 size={16} />
            </StudioButton>
            <StudioButton
              aria-label={
                previewOpen ? "Hide live preview" : "Show live preview"
              }
              aria-expanded={previewOpen}
              aria-controls="live-book-preview"
              className={styles.bookViewButton}
              tooltip="Show or hide the paper preview"
              onClick={onTogglePreview}
            >
              <IconFileTypography size={16} />
              Preview
            </StudioButton>
          </div>
        </div>
        <BookRibbon
          panels={{
            Home: (
              <>
                <RibbonGroup label="Font">
                  <RibbonRow>
                    {" "}
                    <Dropdown
                      label="Selected text font"
                      variant="compact"
                      triggerText={
                        editor?.getAttributes("textStyle").fontFamily
                          ? fonts.fonts.find(
                              (font) =>
                                font.value ===
                                editor.getAttributes("textStyle").fontFamily,
                            )?.label || "Text font"
                          : "Document font"
                      }
                      value={
                        editor?.getAttributes("textStyle").fontFamily ||
                        "document"
                      }
                      disabled={!editor || fonts.fontBusy}
                      options={[
                        { value: "document", label: "Document font" },
                        ...fonts.fonts,
                      ]}
                      onValueChange={(value) => {
                        if (value === "document")
                          editor?.chain().focus().unsetFontFamily().run();
                        else
                          void fonts.load(value).then((ready) => {
                            if (ready)
                              editor
                                ?.chain()
                                .focus()
                                .setFontFamily(value)
                                .run();
                          });
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        editor?.commands.focus();
                      }}
                    />
                    <Dropdown
                      label="Selected text size"
                      variant="compact"
                      value={
                        editor
                          ?.getAttributes("textStyle")
                          .fontSize?.replace("pt", "") || "document"
                      }
                      options={[
                        { value: "document", label: "Body size" },
                        ...fontSizes,
                      ]}
                      disabled={!editor}
                      onValueChange={(value) => {
                        if (value === "document")
                          editor?.chain().focus().unsetFontSize().run();
                        else
                          editor
                            ?.chain()
                            .focus()
                            .setFontSize(`${value}pt`)
                            .run();
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        editor?.commands.focus();
                      }}
                    />
                  </RibbonRow>
                  <RibbonRow>
                    {renderControls([
                      "Bold",
                      "Italic",
                      "Underline",
                      "Strikethrough",
                      "Subscript",
                      "Superscript",
                      "Highlight",
                      "Clear text formatting",
                    ])}
                  </RibbonRow>
                  <RibbonRow>
                    {" "}
                    <Dropdown
                      label="Text ink"
                      variant="compact"
                      triggerText="Text ink"
                      value={editor?.getAttributes("textStyle").color || "auto"}
                      options={[
                        { value: "auto", label: "Automatic" },
                        { value: "#283543", label: "Charcoal" },
                        { value: "#7a2f3b", label: "Burgundy" },
                        { value: "#245a52", label: "Forest" },
                        { value: "#315f86", label: "Blue" },
                      ]}
                      disabled={!editor}
                      onValueChange={(value) => {
                        if (value === "auto")
                          editor?.chain().focus().unsetColor().run();
                        else editor?.chain().focus().setColor(value).run();
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        editor?.commands.focus();
                      }}
                    />
                  </RibbonRow>
                </RibbonGroup>
                <RibbonGroup label="Paragraph">
                  <RibbonRow>
                    {renderControls([
                      "Bullet list",
                      "Numbered list",
                      "Block quote",
                    ])}
                  </RibbonRow>
                  <RibbonRow>{alignments}</RibbonRow>
                  <RibbonRow>
                    <Dropdown
                      label="Line spacing"
                      variant="compact"
                      value={appearance.spacing}
                      options={["1", "1.15", "1.5", "1.8", "2"].map(
                        (value) => ({ value, label: `${value} lines` }),
                      )}
                      onValueChange={(value) => updateDesign("spacing", value)}
                    />
                  </RibbonRow>
                </RibbonGroup>
                <RibbonGroup label="Styles">
                  <RibbonRow>
                    {[
                      { value: "paragraph", label: "Normal", sample: "Aa" },
                      { value: "1", label: "Heading 1", sample: "Aa" },
                      { value: "2", label: "Heading 2", sample: "Aa" },
                      { value: "3", label: "Heading 3", sample: "Aa" },
                    ].map((style) => (
                      <StudioButton
                        key={style.value}
                        data-style={style.value}
                        aria-label={style.label}
                        aria-pressed={
                          style.value === "paragraph"
                            ? editor?.isActive("paragraph")
                            : editor?.isActive("heading", {
                                level: Number(style.value),
                              })
                        }
                        disabled={!editor}
                        onClick={() => {
                          if (style.value === "paragraph")
                            editor?.chain().focus().setParagraph().run();
                          else
                            editor
                              ?.chain()
                              .focus()
                              .setHeading({
                                level: Number(style.value) as 1 | 2 | 3,
                              })
                              .run();
                        }}
                      >
                        <span
                          style={{
                            fontSize:
                              style.value === "1"
                                ? 24
                                : style.value === "2"
                                  ? 20
                                  : 17,
                          }}
                        >
                          {style.sample}
                        </span>
                        <small>{style.label}</small>
                      </StudioButton>
                    ))}
                  </RibbonRow>
                </RibbonGroup>
              </>
            ),
            Insert: (
              <>
                <RibbonGroup label="Illustrations">
                  <StudioButton
                    disabled={!editor || insertingImage}
                    tooltip="Insert an image into your manuscript"
                    onClick={() => inlineImage.current?.click()}
                  >
                    <IconPhotoPlus size={22} />
                    Picture
                  </StudioButton>
                  <StudioButton
                    disabled={imageLoading}
                    tooltip="Add or replace the chapter's opening image"
                    onClick={() => imageInput.current?.click()}
                  >
                    <IconPhotoPlus size={18} />
                    Chapter image
                  </StudioButton>
                </RibbonGroup>
                <RibbonGroup label="Tables">
                  <StudioButton
                    disabled={!editor}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                    }
                  >
                    <IconBook2 size={22} />
                    Insert table
                  </StudioButton>{" "}
                  <Dropdown
                    label="Insert and table tools"
                    variant="compact"
                    triggerText="Insert / Table"
                    value=""
                    disabled={!editor || insertingImage}
                    options={[
                      { value: "image", label: "Insert image" },
                      { value: "table", label: "Insert 3 × 3 table" },
                      { value: "break", label: "Page break" },
                      {
                        value: "row",
                        label: "Add table row",
                        disabled: !editor?.isActive("table"),
                      },
                      {
                        value: "column",
                        label: "Add table column",
                        disabled: !editor?.isActive("table"),
                      },
                      {
                        value: "merge",
                        label: "Merge cells",
                        disabled: !editor?.can().mergeCells(),
                      },
                      {
                        value: "split",
                        label: "Split cell",
                        disabled: !editor?.can().splitCell(),
                      },
                      {
                        value: "removeRow",
                        label: "Delete table row",
                        disabled: !editor?.isActive("table"),
                      },
                      {
                        value: "removeColumn",
                        label: "Delete table column",
                        disabled: !editor?.isActive("table"),
                      },
                      {
                        value: "removeTable",
                        label: "Delete table",
                        disabled: !editor?.isActive("table"),
                      },
                    ]}
                    onValueChange={(value) => {
                      const chain = editor?.chain().focus();
                      if (value === "image") inlineImage.current?.click();
                      if (value === "table")
                        chain
                          ?.insertTable({
                            rows: 3,
                            cols: 3,
                            withHeaderRow: true,
                          })
                          .run();
                      if (value === "break")
                        chain
                          ?.insertContent([
                            { type: "bookPageBreak" },
                            { type: "paragraph" },
                          ])
                          .run();
                      if (value === "row") chain?.addRowAfter().run();
                      if (value === "column") chain?.addColumnAfter().run();
                      if (value === "merge") chain?.mergeCells().run();
                      if (value === "split") chain?.splitCell().run();
                      if (value === "removeRow") chain?.deleteRow().run();
                      if (value === "removeColumn") chain?.deleteColumn().run();
                      if (value === "removeTable") chain?.deleteTable().run();
                    }}
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      editor?.commands.focus();
                    }}
                  />
                </RibbonGroup>
                <RibbonGroup label="Breaks">
                  <StudioButton
                    disabled={!editor}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .insertContent([
                          { type: "bookPageBreak" },
                          { type: "paragraph" },
                        ])
                        .run()
                    }
                  >
                    <IconFileTypography size={20} />
                    Insert page
                  </StudioButton>
                  <StudioButton
                    disabled={!editor}
                    onClick={() =>
                      editor?.chain().focus().setHorizontalRule().run()
                    }
                  >
                    <IconSeparator size={20} />
                    Scene break
                  </StudioButton>
                </RibbonGroup>
              </>
            ),
            Design: (
              <DesignRibbonTools
                section="design"
                design={appearance}
                onChange={onAppearanceChange}
                fonts={fonts}
                onTypeset={onTypeset}
              />
            ),
            Layout: (
              <DesignRibbonTools
                section="layout"
                design={appearance}
                onChange={onAppearanceChange}
                fonts={fonts}
                onTypeset={onTypeset}
              />
            ),
            View: (
              <>
                <RibbonGroup label="Writing view">
                  <StudioButton
                    aria-pressed={focusMode}
                    onClick={() => setFocusMode(!focusMode)}
                  >
                    <IconFocus2 size={20} />
                    Focus view
                  </StudioButton>
                </RibbonGroup>
                <RibbonGroup label="Zoom">
                  <Dropdown
                    label="Preview zoom"
                    variant="compact"
                    value={appearance.pageZoom}
                    options={[
                      { value: "fit", label: "Fit page" },
                      { value: "0.5", label: "50%" },
                      { value: "0.75", label: "75%" },
                      { value: "1", label: "100%" },
                      { value: "1.25", label: "125%" },
                    ]}
                    onValueChange={(value) => updateDesign("pageZoom", value)}
                  />
                </RibbonGroup>
                <RibbonGroup label="Output">
                  <StudioButton
                    tooltip="Paginate your complete book and open print options"
                    onClick={onTypeset}
                  >
                    <IconFileTypography size={22} />
                    Book view / PDF
                  </StudioButton>
                </RibbonGroup>
              </>
            ),
            Help: (
              <>
                <RibbonGroup label="Writing help">
                  <StudioButton popoverTarget="studio-help">
                    Studio guides
                  </StudioButton>
                  <p>
                    Write and format your chapters. Use Book view to check the
                    complete book.
                  </p>
                </RibbonGroup>
              </>
            ),
          }}
        />
        <input
          ref={inlineImage}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setInsertError("Choose a PNG, JPEG or WebP image under 5 MB.");
              return;
            }
            setInsertingImage(true);
            setInsertError("");
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string")
                editor
                  ?.chain()
                  .focus()
                  .setImage({
                    src: reader.result,
                    alt: file.name.replace(/\.[^.]+$/, ""),
                  })
                  .run();
              setInsertingImage(false);
            };
            reader.onerror = () => {
              setInsertError("The image could not be opened.");
              setInsertingImage(false);
            };
            reader.readAsDataURL(file);
          }}
        />{" "}
        <input
          ref={imageInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (
              !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setImageError(
                "Choose a PNG, JPEG or WebP image smaller than 5 MB.",
              );
              return;
            }
            setImageError("");
            setImageLoading(true);
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string")
                onHeaderImageChange(reader.result);
              setImageLoading(false);
            };
            reader.onerror = () => {
              setImageError(
                "This image could not be opened. Try another image.",
              );
              setImageLoading(false);
            };
            reader.readAsDataURL(file);
          }}
        />
        {imageError && (
          <p className={styles.imageError} role="alert">
            {imageError}
          </p>
        )}
        {fonts.fontMessage && (
          <p className={styles.designNote} role="status">
            {fonts.fontMessage}
          </p>
        )}
        {insertError && (
          <p className={styles.imageError} role="alert">
            {insertError}
          </p>
        )}
        <div className={styles.pageScroll}>
          <article className={styles.page}>
            <TextInput
              className={styles.chapterTitle}
              aria-label="Chapter title"
              value={chapter.title}
              placeholder="Untitled chapter"
              maxLength={100}
              onChange={(event) => onRename(event.target.value)}
            />
            <svg
              className={styles.chapterRule}
              viewBox="0 0 100 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 9C20 0 35 16 50 8C65 0 80 16 98 7M47 8l3-3 3 3-3 3z"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            {!focusMode && chapter.headerImage && (
              <div className={styles.headerArea}>
                <StudioButton
                  className={styles.headerImage}
                  disabled={imageLoading}
                  aria-label={
                    chapter.headerImage
                      ? "Replace chapter header image"
                      : "Add chapter header image"
                  }
                  onClick={() => imageInput.current?.click()}
                >
                  {chapter.headerImage ? (
                    <img src={chapter.headerImage} alt="Chapter header" />
                  ) : (
                    <>
                      <IconPhotoPlus size={28} stroke={1.5} />
                      <span>
                        {imageLoading ? "Opening image…" : "Add a header image"}
                      </span>
                    </>
                  )}
                </StudioButton>
                {chapter.headerImage && (
                  <StudioButton
                    className={styles.removeImage}
                    aria-label="Remove chapter header image"
                    onClick={() => onHeaderImageChange(null)}
                  >
                    <IconTrash size={15} />
                  </StudioButton>
                )}
              </div>
            )}

            {!editor && (
              <p className={styles.loading}>Opening your writing space…</p>
            )}
            <div
              className={styles.editorWrap}
              dir={appearance.direction}
              lang={appearance.language}
              style={{ hyphens: appearance.hyphens ? "auto" : "manual" }}
            >
              {editor?.isEmpty && (
                <span className={styles.placeholder} aria-hidden="true">
                  Begin writing your chapter…
                </span>
              )}
              <EditorContent editor={editor} />
            </div>
          </article>
        </div>
        <footer className={styles.statusBar}>
          <span>
            {chapter.words.toLocaleString()}{" "}
            {chapter.words === 1 ? "word" : "words"}
          </span>
          <div>
            <span role="status">
              {pageInfo.busy
                ? "Updating pages…"
                : pageInfo.total
                  ? `${pageInfo.total} ${pageInfo.total === 1 ? "page" : "pages"} · Book`
                  : "Page count unavailable"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function BookWorkspace({
  book,
  chapterId,
  onAddChapter,
  onChangeChapter,
  onRenameChapter,
  onHeaderImageChange,
  onDesignChange,
}: {
  book: PreviewBook;
  chapterId: string | null;
  onAddChapter: () => void;
  onChangeChapter: (chapterId: string, html: string, words: number) => void;
  onRenameChapter: (chapterId: string, title: string) => void;
  onHeaderImageChange: (chapterId: string, image: string | null) => void;
  onDesignChange: (design: BookDesign) => void;
}) {
  const [typesetting, setTypesetting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pageInfo, setPageInfo] = useState<PaginationInfo>({
    page: 1,
    total: 0,
    busy: true,
  });
  const fonts = useFontLibrary();
  const appearance = book.design ?? defaultBookDesign;
  const chapter = book.chapters.find((item) => item.id === chapterId);
  const showPreview = previewOpen && !!chapter && !typesetting;
  return (
    <div className={styles.workspaceLayout} data-preview-open={showPreview}>
      <section
        className={styles.workspace}
        aria-label={`${book.title} book workspace`}
      >
        <header className={styles.breadcrumb}>
          <IconBook2 size={15} />
          <span>{book.title}</span>
          <IconChevronRight size={12} />
          <span>
            {chapter ? chapter.title || "Untitled chapter" : "Manuscript"}
          </span>
          <span className={styles.bookType}>{book.type}</span>
          <StudioButton aria-label="New chapter" onClick={onAddChapter}>
            <IconPlus size={14} />
            Chapter
          </StudioButton>
        </header>
        {typesetting && (
          <BookPrintView
            book={book}
            design={appearance}
            fonts={fonts.fonts}
            onClose={() => setTypesetting(false)}
          />
        )}
        <div className={styles.writingPane} hidden={typesetting}>
          {chapter ? (
            <Manuscript
              key={chapter.id}
              chapter={chapter}
              book={book}
              onChange={(html, words) =>
                onChangeChapter(chapter.id, html, words)
              }
              onRename={(title) => onRenameChapter(chapter.id, title)}
              onHeaderImageChange={(image) =>
                onHeaderImageChange(chapter.id, image)
              }
              appearance={appearance}
              onAppearanceChange={onDesignChange}
              fonts={fonts}
              previewOpen={previewOpen}
              onTogglePreview={() => setPreviewOpen((open) => !open)}
              pageInfo={pageInfo}
              onTypeset={() => setTypesetting(true)}
            />
          ) : (
            <div className={styles.emptyManuscript}>
              <div className={styles.bookCover}>
                {book.covers.front ? (
                  <img
                    src={book.covers.front}
                    alt={`${book.title} front cover`}
                  />
                ) : (
                  <IconBook2 size={47} stroke={1.1} />
                )}
              </div>
              {(book.covers.back || book.covers.spine) && (
                <div className={styles.coverDetails}>
                  {book.covers.back && (
                    <img
                      className={styles.backCover}
                      src={book.covers.back}
                      alt={`${book.title} back cover`}
                    />
                  )}
                  {book.covers.spine && (
                    <img
                      className={styles.spineCover}
                      src={book.covers.spine}
                      alt={`${book.title} spine cover`}
                    />
                  )}
                </div>
              )}
              <span className={styles.eyebrow}>{book.type} · Manuscript</span>
              <h1>{book.title}</h1>
              {book.subtitle && (
                <p className={styles.subtitle}>{book.subtitle}</p>
              )}
              <div className={styles.emptyRule} />
              <StudioButton
                className={styles.firstChapter}
                tooltip="Create the opening chapter and start writing"
                onClick={onAddChapter}
              >
                <IconFeather size={16} />
                Create First Chapter
              </StudioButton>
            </div>
          )}
        </div>
      </section>
      {chapter && (
        <aside
          id="live-book-preview"
          className={`${styles.livePreview} ${!showPreview ? styles.previewHidden : ""}`}
          aria-label="Live book preview"
          aria-hidden={!showPreview}
          inert={!showPreview}
        >
          <BookPrintView
            book={book}
            design={appearance}
            fonts={fonts.fonts}
            mode="preview"
            zoomValue={appearance.pageZoom}
            onPagination={setPageInfo}
          />
        </aside>
      )}
    </div>
  );
}
