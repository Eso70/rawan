"use client";

import { useEffect, useState } from "react";
import styles from "./login.module.css";

export function LoginHeading({ signup }: { signup: boolean }) {
  const text = signup
    ? "Your imagination’s new home"
    : "Step back into creation";
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const timer = window.setInterval(
      () =>
        setCount((value) => {
          if (value >= text.length) {
            window.clearInterval(timer);
            return value;
          }
          return value + 1;
        }),
      32,
    );
    return () => window.clearInterval(timer);
  }, [text]);
  return (
    <h1
      id="login-title"
      aria-label={text}
      className={signup ? styles.signupHeading : undefined}
    >
      <span aria-hidden="true">
        {text.slice(0, count)}
        {count < text.length && <span className={styles.caret}>|</span>}
      </span>
    </h1>
  );
}
