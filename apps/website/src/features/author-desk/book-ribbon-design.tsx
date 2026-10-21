"use client";

import { useRef } from "react";
import { IconUpload, IconDeviceDesktop } from "@tabler/icons-react";
import { StudioButton } from "../../components/ui/tooltip";
import { FormInput } from "../../components/ui/form-input";
import { Dropdown } from "../../components/ui/dropdown";
import { RibbonGroup, RibbonRow } from "./book-ribbon";
import { trimSizes, type BookDesign } from "./book-design";
import type { useFontLibrary } from "./use-font-library";

export const fontSizes = [
  9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 72,
].map((size) => ({ value: String(size), label: `${size} pt` }));
function NumberField({
  label,
  value,
  max = 35,
  min = 0,
  step = 1,
  unit = "mm",
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  min?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <FormInput
        type="number"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (Number.isFinite(next))
            onChange(Math.max(min, Math.min(max, next)));
        }}
      />
      {unit}
    </label>
  );
}
export function DesignRibbonTools({
  section,
  design,
  onChange,
  fonts,
  onTypeset,
}: {
  section: "design" | "layout";
  design: BookDesign;
  onChange: (design: BookDesign) => void;
  fonts: ReturnType<typeof useFontLibrary>;
  onTypeset: () => void;
}) {
  const upload = useRef<HTMLInputElement>(null);
  const latest = useRef(design);
  latest.current = design;
  const update = <K extends keyof BookDesign>(key: K, value: BookDesign[K]) =>
    onChange({ ...latest.current, [key]: value });
  const toggle = (
    key:
      | "dropCap"
      | "hyphens"
      | "runningHeads"
      | "folios"
      | "titlePage"
      | "contents",
    label: string,
    description?: string,
  ) => (
    <StudioButton
      aria-pressed={design[key]}
      tooltip={description || label}
      onClick={() => update(key, !design[key])}
    >
      {label}
    </StudioButton>
  );
  if (section === "design")
    return (
      <>
        <RibbonGroup label="Document typography">
          <Dropdown
            label="Document font"
            variant="compact"
            value={design.face}
            options={fonts.fonts}
            disabled={fonts.fontBusy}
            onValueChange={(value) =>
              void fonts.load(value).then((ready) => {
                if (ready) update("face", value);
              })
            }
          />
          <RibbonRow>
            <Dropdown
              label="Body size"
              variant="compact"
              value={design.size}
              options={fontSizes}
              onValueChange={(value) => update("size", value)}
            />
            <Dropdown
              label="Line spacing"
              variant="compact"
              value={design.spacing}
              options={["1", "1.15", "1.3", "1.5", "1.8", "2", "2.2"].map(
                (value) => ({ value, label: `${value} lines` }),
              )}
              onValueChange={(value) => update("spacing", value)}
            />
          </RibbonRow>
          <NumberField
            label="Letter spacing"
            value={design.tracking}
            min={-1}
            max={3}
            step={0.1}
            unit="px"
            onChange={(value) => update("tracking", value)}
          />
        </RibbonGroup>
        <RibbonGroup label="Fonts">
          <StudioButton
            tooltip="Add a WOFF2, WOFF, TTF, or OTF font"
            disabled={fonts.fontBusy}
            onClick={() => upload.current?.click()}
          >
            <IconUpload size={16} />
            Upload font
          </StudioButton>
          <StudioButton
            tooltip="Request access to fonts installed on this device"
            disabled={fonts.fontBusy}
            onClick={() => void fonts.scanDevice()}
          >
            <IconDeviceDesktop size={16} />
            Device fonts
          </StudioButton>
          <input
            ref={upload}
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file)
                void fonts.upload(file).then((value) => {
                  if (value) update("face", value);
                });
            }}
          />
        </RibbonGroup>
        <RibbonGroup label="Paragraphs">
          <NumberField
            label="Space after"
            value={design.paragraphGap}
            max={36}
            unit="pt"
            onChange={(value) => update("paragraphGap", value)}
          />
          <NumberField
            label="First-line indent"
            value={design.indent}
            max={15}
            onChange={(value) => update("indent", value)}
          />
          <RibbonRow>
            {toggle("dropCap", "Drop cap")}
            {toggle(
              "hyphens",
              "Hyphenation",
              "Use the document language for automatic hyphenation",
            )}
          </RibbonRow>
        </RibbonGroup>
        <RibbonGroup label="Language">
          <Dropdown
            label="Text direction"
            variant="compact"
            value={design.direction}
            options={[
              { value: "ltr", label: "Left to right" },
              { value: "rtl", label: "Right to left" },
            ]}
            onValueChange={(value) =>
              update("direction", value as "ltr" | "rtl")
            }
          />
          <Dropdown
            label="Document language"
            variant="compact"
            value={design.language}
            options={[
              { value: "en", label: "English" },
              { value: "ar", label: "Arabic" },
              { value: "ku", label: "Kurdish" },
              { value: "fr", label: "French" },
              { value: "de", label: "German" },
              { value: "es", label: "Spanish" },
            ]}
            onValueChange={(value) => update("language", value)}
          />
          <Dropdown
            label="Writing width"
            variant="compact"
            value={design.width}
            options={[
              { value: "560", label: "Narrow" },
              { value: "680", label: "Comfortable" },
              { value: "820", label: "Wide" },
            ]}
            onValueChange={(value) => update("width", value)}
          />
        </RibbonGroup>
      </>
    );
  return (
    <>
      <RibbonGroup label="Page setup">
        <Dropdown
          label="Book size"
          variant="compact"
          value={design.trim}
          options={trimSizes}
          onValueChange={(value) => update("trim", value)}
        />
        <Dropdown
          label="Orientation"
          variant="compact"
          value={design.orientation}
          options={[
            { value: "portrait", label: "Portrait" },
            { value: "landscape", label: "Landscape" },
          ]}
          onValueChange={(value) =>
            update("orientation", value as "portrait" | "landscape")
          }
        />
      </RibbonGroup>
      <RibbonGroup label="Paper appearance">
        <label>
          <span>Print color</span>
          <input
            type="color"
            aria-label="Print paper color"
            value={
              design.paperColor ??
              (design.paper === "ivory" ? "#f5f0e5" : "#ffffff")
            }
            onInput={(event) => update("paperColor", event.currentTarget.value)}
          />
        </label>
        <Dropdown
          label="Preview paper appearance"
          variant="compact"
          value={design.previewPaper ?? "theme"}
          options={[
            { value: "theme", label: "Follow theme" },
            { value: "print", label: "Use print color" },
          ]}
          onValueChange={(value) =>
            update("previewPaper", value as "theme" | "print")
          }
        />
      </RibbonGroup>
      <RibbonGroup label="Margins & binding">
        <RibbonRow>
          <NumberField
            label="Top margin"
            value={design.top}
            onChange={(value) => update("top", value)}
          />
          <NumberField
            label="Bottom margin"
            value={design.bottom}
            onChange={(value) => update("bottom", value)}
          />
        </RibbonRow>
        <RibbonRow>
          <NumberField
            label="Inside margin"
            value={design.inside}
            onChange={(value) => update("inside", value)}
          />
          <NumberField
            label="Outside margin"
            value={design.outside}
            onChange={(value) => update("outside", value)}
          />
        </RibbonRow>
        <NumberField
          label="Binding gutter"
          value={design.gutter}
          max={15}
          onChange={(value) => update("gutter", value)}
        />
      </RibbonGroup>
      <RibbonGroup label="Book structure">
        <RibbonRow>
          {toggle("titlePage", "Title page")}
          {toggle(
            "contents",
            "Contents",
            "Generate a table of contents with chapter page numbers",
          )}
        </RibbonRow>
        <RibbonRow>
          {toggle("runningHeads", "Running headers")}
          {toggle("folios", "Page numbers")}
        </RibbonRow>
        <Dropdown
          label="Chapters begin"
          variant="compact"
          value={design.chapterStart}
          options={[
            { value: "next", label: "Next page" },
            { value: "recto", label: "Right-hand page" },
          ]}
          onValueChange={(value) =>
            update("chapterStart", value as "next" | "recto")
          }
        />
      </RibbonGroup>
      <RibbonGroup label="Output">
        <StudioButton onClick={onTypeset}>Book view / PDF</StudioButton>
      </RibbonGroup>
    </>
  );
}
