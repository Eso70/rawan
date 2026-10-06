"use client";

import { useEffect, useState } from "react";

export function useLandingNavigationVisibility() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let previous = Math.max(0, window.scrollY);
    let directionStart = previous;
    let direction = 0;
    let inputDirection = 0;
    let intentUntil = 0;
    let touchY = 0;
    let frame = 0;
    const pinned = () => {
      const finalTop = document
        .getElementById("final-cta")
        ?.getBoundingClientRect().top;
      return window.scrollY < 80 || (finalTop !== undefined && finalTop <= 80);
    };
    const update = () => {
      frame = 0;
      const y = Math.max(
        0,
        Math.min(
          window.scrollY,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      if (pinned()) setVisible(true);
      else if (performance.now() < intentUntil) setVisible(inputDirection < 0);
      else {
        const delta = y - previous;
        if (Math.abs(delta) > 0.5) {
          const nextDirection = Math.sign(delta);
          if (nextDirection !== direction) {
            directionStart = previous;
            direction = nextDirection;
          }
          if (Math.abs(y - directionStart) > 8) setVisible(direction < 0);
        }
      }
      previous = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const intent = (delta: number) => {
      if (Math.abs(delta) < 2) return;
      inputDirection = Math.sign(delta);
      intentUntil = performance.now() + 350;
      direction = inputDirection;
      directionStart = Math.max(0, window.scrollY);
      setVisible(pinned() || inputDirection < 0);
    };
    const wheel = (event: WheelEvent) => {
      if (!event.defaultPrevented && !event.ctrlKey && !event.metaKey)
        intent(event.deltaY);
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) touchY = event.touches[0].clientY;
    };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const next = event.touches[0].clientY;
      intent(touchY - next);
      touchY = next;
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, [contenteditable=true]",
          ))
      )
        return;
      if (["ArrowUp", "PageUp", "Home"].includes(event.key)) intent(-10);
      if (["ArrowDown", "PageDown", "End"].includes(event.key)) intent(10);
    };
    setVisible(pinned());
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("keydown", keyboard);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("keydown", keyboard);
    };
  }, []);
  return visible;
}
