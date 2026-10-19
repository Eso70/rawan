"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { Button } from "./controls";
import styles from "./language-dropdown.module.css";

type LanguageDropdownProps = {
  variant?: "compact" | "field";
  id?: string;
  labelledBy?: string;
};

const languages = [
  { code: "en", label: "English", short: "EN" },
  { code: "ku", label: "Kurdish", short: "KU" },
  { code: "ar", label: "Arabic", short: "AR" },
] as const;

/** Non-English selections are local UI mocks; the real interface remains English. */
export function LanguageDropdown({
  variant = "compact",
  id,
  labelledBy,
}: LanguageDropdownProps) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [selected, setSelected] = useState<(typeof languages)[number]>(
    languages[0],
  );
  const close = () => {
    if (!menu.current) return;
    menu.current.open = false;
    menu.current.querySelector("summary")?.focus();
  };
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (
        menu.current &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  return (
    <details
      ref={menu}
      className={styles.language}
      data-variant={variant}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <summary
        id={id}
        aria-label={labelledBy ? undefined : `Language: ${selected.label}`}
        aria-labelledby={labelledBy}
      >
        {variant === "field" ? selected.label : selected.short}
        <IconChevronDown size={10} aria-hidden="true" />
      </summary>
      <div className={styles.menu}>
        {languages.map((language) => (
          <Button
            key={language.code}
            onClick={() => {
              setSelected(language);
              close();
            }}
            aria-label={`${language.label}${language.code === "en" ? "" : ", preview only"}`}
            aria-pressed={selected.code === language.code}
          >
            <span aria-hidden="true">{language.short}</span> {language.label}
          </Button>
        ))}
      </div>
    </details>
  );
}
