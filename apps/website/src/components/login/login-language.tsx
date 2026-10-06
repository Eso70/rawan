"use client";

import { useEffect, useRef } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import styles from "./login.module.css";

export function LoginLanguage() {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        menu.current &&
        event.target instanceof Node &&
        !menu.current.contains(event.target)
      )
        menu.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details
      ref={menu}
      className={styles.language}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Language: English">
        EN <IconChevronDown size={10} aria-hidden="true" />
      </summary>
      <div className={styles.languageMenu}>
        <button
          onClick={() => {
            if (menu.current) menu.current.open = false;
          }}
          aria-label="English, current language"
        >
          English <span>EN</span>
        </button>
      </div>
    </details>
  );
}
