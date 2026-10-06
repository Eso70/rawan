"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import Lenis from "lenis";

const ScrollContext = createContext<RefObject<Lenis | null> | null>(null);

export function useLandingScroll() {
  return useContext(ScrollContext);
}

export function LandingScroll({ children }: { children: ReactNode }) {
  const scroller = useRef<Lenis | null>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      scroller.current?.destroy();
      scroller.current = preference.matches
        ? null
        : new Lenis({
            autoRaf: true,
            duration: 1.2,
            lerp: 0,
            easing: (value) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
            smoothWheel: true,
            syncTouch: false,
            allowNestedScroll: true,
          });
    };
    sync();
    const alignInitialHash = () => {
      try {
        const target = document.getElementById(
          decodeURIComponent(window.location.hash.slice(1)),
        );
        if (target) {
          scroller.current?.resize();
          scroller.current?.scrollTo(target, { immediate: true });
        }
      } catch {
        /* Ignore malformed incoming fragments. */
      }
    };
    const frame = requestAnimationFrame(alignInitialHash);
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        return;
      let target;
      try {
        target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      } catch {
        return;
      }
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", url.hash);
      if (scroller.current) scroller.current.scrollTo(target);
      else target.scrollIntoView({ behavior: "instant" });
    };
    document.addEventListener("click", navigate);
    preference.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", navigate);
      preference.removeEventListener("change", sync);
      scroller.current?.destroy();
      scroller.current = null;
    };
  }, []);
  return (
    <ScrollContext.Provider value={scroller}>{children}</ScrollContext.Provider>
  );
}
