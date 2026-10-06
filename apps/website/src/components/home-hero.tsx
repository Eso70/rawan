"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./brand-mark";
import styles from "./home-hero.module.css";

export function HomeHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const element = video.current;
    if (!element) return;
    let visible = true;
    const sync = () => {
      if (preference.matches || !visible || document.hidden) {
        element.pause();
      } else {
        element.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    sync();
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, []);

  function showNextStep() {
    setNotice(
      "The writing workspace is coming next. This page is the first step.",
    );
  }

  return (
    <section className={styles.hero} aria-label="Welcome to Rawan">
      <div className={styles.backdrop} aria-hidden="true">
        <video
          ref={video}
          className={styles.video}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/homepagevid-poster.jpg"
        >
          <source
            media="(max-width: 767px)"
            src="/videos/homepagevid-mobile.mp4"
            type="video/mp4"
          />
          <source src="/videos/homepagevid.mp4" type="video/mp4" />
        </video>
        <div className={styles.shade} />
        <div className={styles.bottomFade} />
      </div>
      <section className={styles.content} aria-labelledby="hero-title">
        <div className={styles.badge}>
          <BrandMark className={styles.badgeMark} />
          <span>Made for storytellers</span>
        </div>
        <h1 id="hero-title">The modern storytelling toolkit</h1>
        <p className={styles.description}>
          Create, organize, and share your worlds with tools that work as
          smoothly as your imagination.
        </p>
        <div className={styles.action}>
          <button className={styles.primaryCta} onClick={showNextStep}>
            <strong>Start building</strong>
            <span>– it&apos;s free</span>
          </button>
        </div>
        <div className={styles.community}>
          <span className={styles.avatars} aria-hidden="true">
            <span>M</span>
            <span>A</span>
            <span>R</span>
          </span>
          <span>A home for your stories</span>
        </div>
        <p className={styles.notice} role="status" aria-live="polite">
          {notice}
        </p>
      </section>
      <span className={styles.scrollCue} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="m5 9 7 7 7-7"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </section>
  );
}
