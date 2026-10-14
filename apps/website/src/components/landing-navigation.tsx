"use client";

import { BrandMark } from "./brand-mark";
import { SearchTrigger } from "./library/library-search";
import { useState } from "react";
import { useLandingNavigationVisibility } from "./use-landing-navigation";
import styles from "./landing-navigation.module.css";

export function LandingNavigation({ current }: { current?: "library" }) {
  const visible = useLandingNavigationVisibility();
  const [notice, setNotice] = useState("");
  const onAction = () =>
    setNotice("The writing workspace is coming next. Your stories begin here.");
  return (
    <header
      className={`${styles.header} ${!visible ? styles.hiddenHeader : ""}`}
      inert={!visible}
      aria-hidden={!visible}
    >
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.navLeft}>
          <a className={styles.brand} href="/" aria-label="Rawan home">
            <BrandMark className={styles.brandMark} priority />
            <span>rawan</span>
          </a>
          <a
            className={styles.library}
            href="/library"
            aria-current={current === "library" ? "page" : undefined}
          >
            Library
          </a>
          <div className={styles.navLinks}>
            <button disabled title="Coming later">
              Why Rawan
            </button>
            <button disabled title="Coming later">
              Pricing
            </button>
            <button disabled title="Coming later">
              Download
            </button>
          </div>
          <span className={styles.language}>
            EN
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m3 4.5 3 3 3-3"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
        <div className={styles.navRight}>
          {current === "library" && <SearchTrigger />}
          <a className={styles.login} href="/login">
            Login
          </a>
          <button className={styles.navCta} onClick={onAction}>
            Start Building
          </button>
        </div>
      </nav>
      {notice && (
        <p className={styles.navigationNotice} role="status">
          {notice}
        </p>
      )}
    </header>
  );
}
