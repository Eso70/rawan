"use client";

import { useState } from "react";
import { Dropdown } from "./dropdown";

const languages = [
  { value: "en", label: "English", prefix: "EN" },
  { value: "ku", label: "Kurdish", prefix: "KU" },
  { value: "ar", label: "Arabic", prefix: "AR" },
] as const;

/** Non-English selections remain local presentation choices until translation is available. */
export function LanguageDropdown({ variant = "compact", id, labelledBy }: {
  variant?: "compact" | "field";
  id?: string;
  labelledBy?: string;
}) {
  const [value, setValue] = useState("en");
  const selected = languages.find((language) => language.value === value) ?? languages[0];
  return <Dropdown id={id} label={`Language: ${selected.label}`} labelledBy={labelledBy}
    variant={variant === "compact" ? "inline" : "field"} value={value} onValueChange={setValue}
    triggerText={variant === "compact" ? selected.prefix : selected.label}
    options={languages.map((language) => ({ ...language, ariaLabel: `${language.label}${language.value === "en" ? "" : ", preview only"}` }))} />;
}
