"use client";

import { useState } from "react";

export type BookFont = { value: string; label: string; source: "included" | "device" | "uploaded"; data?: string };
type DeviceFont = { family: string; fullName: string; style: string; blob: () => Promise<Blob> };
type FontWindow = Window & { queryLocalFonts?: () => Promise<DeviceFont[]> };
const included: BookFont[] = ["Rawan Lora", "Source Serif 4 Variable", "Literata Variable", "Noto Naskh Arabic Variable", "Rawan Inter", "Rawan Space Grotesk", "Rawan Caveat", "Georgia", "Arial", "Verdana", "Times New Roman", "Courier New"].map((value) => ({ value, label: value.replace("Rawan ", "").replace(" Variable", ""), source: "included" }));
const importedFonts = new Map<string, BookFont>();
const localFonts = new Map<string, DeviceFont>();

export function blobData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The file could not be read.")); reader.onerror = () => reject(new Error("The file could not be read.")); reader.readAsDataURL(blob); });
}
async function registerFont(value: string, label: string, blob: Blob, source: "device" | "uploaded") {
  const data = await blobData(blob);
  const fontFace = new FontFace(value, `url("${data}")`);
  await fontFace.load(); document.fonts.add(fontFace);
  const font: BookFont = { value, label, source, data };
  importedFonts.set(value, font);
  return font;
}
export function useFontLibrary() {
  const [fonts, setFonts] = useState<BookFont[]>(() => [...included, ...importedFonts.values()]);
  const [fontBusy, setFontBusy] = useState(false);
  const [fontMessage, setFontMessage] = useState("");
  const merge = (next: BookFont[]) => setFonts((current) => [...new Map([...current, ...next].map((item) => [item.value, item])).values()]);
  const upload = async (file: File): Promise<string | undefined> => {
    if (!/\.(woff2?|ttf|otf)$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setFontMessage("Choose a WOFF2, WOFF, TTF or OTF font under 10 MB."); return; }
    setFontBusy(true); setFontMessage("");
    try { const label = file.name.replace(/\.[^.]+$/, "").replaceAll(/[_-]/g, " "); const value = `RawanUploaded${crypto.randomUUID().replaceAll("-", "")}`; const font = await registerFont(value, label, file, "uploaded"); merge([font]); setFontMessage(`${label} is ready to use.`); return value; }
    catch { setFontMessage("This font could not be opened. Try another font file."); }
    finally { setFontBusy(false); }
  };
  const scanDevice = async () => {
    const query = (window as FontWindow).queryLocalFonts;
    if (!query || !window.isSecureContext) { setFontMessage("This browser cannot list device fonts. You can upload a font file instead."); return; }
    setFontBusy(true); setFontMessage("Allow font access in your browser to list device fonts.");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const found = await Promise.race([query.call(window), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Font access timed out.")), 30000); })]);
      for (const font of found) { const previous = localFonts.get(font.family); if (!previous || /regular|normal|book/i.test(font.style)) localFonts.set(font.family, font); }
      merge([...localFonts.keys()].sort((a,b) => a.localeCompare(b)).map((value) => ({ value, label: value, source: "device" })));
      setFontMessage(found.length ? `${localFonts.size} device font families available.` : "No device fonts were shared. You can upload a font instead.");
    } catch { setFontMessage("Device fonts were not shared. You can try again or upload a font file."); }
    finally { clearTimeout(timer); setFontBusy(false); }
  };
  const load = async (value: string): Promise<boolean> => {
    const local = localFonts.get(value);
    if (!local || importedFonts.has(value)) return true;
    setFontBusy(true); setFontMessage("");
    try { const font = await registerFont(value, value, await local.blob(), "device"); merge([font]); return true; }
    catch { setFontMessage("This device font could not be loaded. Try another font or upload its file."); return false; }
    finally { setFontBusy(false); }
  };
  return { fonts, fontBusy, fontMessage, upload, scanDevice, load };
}
