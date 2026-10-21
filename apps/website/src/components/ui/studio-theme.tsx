"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";

export type StudioTheme = "dark" | "light";
export const StudioThemeContext = createContext<StudioTheme | undefined>(
  undefined,
);
export const useStudioTheme = () => useContext(StudioThemeContext);
import { flushSync } from "react-dom";

const storageKey = "rawan:studio:theme";

export function useStudioThemePreference() {
  const [theme, setTheme] = useState<StudioTheme>("dark");
  const currentTheme = useRef<StudioTheme>("dark");
  const running = useRef<ViewTransition | null>(null);
  const version = useRef(0);
  const clearReveal = () => {
    const root = document.documentElement;
    root.removeAttribute("data-studio-theme-reveal");
    for (const name of ["--theme-x", "--theme-y", "--theme-radius"])
      root.style.removeProperty(name);
  };
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "light") {
        currentTheme.current = "light";
        setTheme("light");
      }
    } catch {
      /* Theme remains available when storage is blocked. */
    }
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      version.current++;
      running.current?.skipTransition();
      running.current = null;
      clearReveal();
      currentTheme.current = event.newValue === "light" ? "light" : "dark";
      setTheme(currentTheme.current);
    };
    window.addEventListener("storage", sync);
    return () => {
      version.current++;
      running.current?.skipTransition();
      running.current = null;
      clearReveal();
      window.removeEventListener("storage", sync);
    };
  }, []);
  const toggleTheme = (event?: MouseEvent<HTMLButtonElement>) => {
    const next = currentTheme.current === "dark" ? "light" : "dark";
    currentTheme.current = next;
    const id = ++version.current;
    const commit = () => {
      if (id !== version.current) return;
      flushSync(() => setTheme(next));
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* Keep this tab's preference. */
      }
    };
    // Interruptions finish directly instead of snapshotting a partly clipped transition.
    const interrupted = !!running.current;
    running.current?.skipTransition();
    running.current = null;
    clearReveal();
    if (
      interrupted ||
      !document.startViewTransition ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      commit();
      return;
    }
    const rect = event?.currentTarget.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
    const root = document.documentElement;
    root.style.setProperty("--theme-x", `${x}px`);
    root.style.setProperty("--theme-y", `${y}px`);
    root.style.setProperty(
      "--theme-radius",
      `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 4}px`,
    );
    root.setAttribute("data-studio-theme-reveal", next);
    try {
      const transition = document.startViewTransition(async () => {
        commit();
        // Let the embedded paper receive its palette message before taking the new snapshot.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });
      running.current = transition;
      void transition.ready.catch(() => {});
      void transition.finished
        .catch(() => {})
        .finally(() => {
          if (id !== version.current) return;
          running.current = null;
          clearReveal();
        });
    } catch {
      clearReveal();
      commit();
    }
  };
  return { theme, toggleTheme };
}
