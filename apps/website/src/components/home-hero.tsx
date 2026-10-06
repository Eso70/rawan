"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./brand-mark";
import styles from "./home-hero.module.css";

export function HomeHero() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      const element = video.current;
      if (!element) return;
      if (preference.matches) {
        element.pause();
      } else {
        element.play().catch(() => setPlaying(false));
      }
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  function togglePlayback() {
    const element = video.current;
    if (!element) return;
    if (element.paused)
      element
        .play()
        .catch(() =>
          setNotice(
            "Your browser paused the background video. You can still explore this page.",
          ),
        );
    else element.pause();
  }

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
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
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
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <div className={styles.navLeft}>
            <a className={styles.brand} href="/" aria-label="Rawan home">
              <BrandMark className={styles.brandMark} priority />
              <span>rawan</span>
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
            <button className={styles.login} onClick={showNextStep}>
              Login
            </button>
            <button className={styles.navCta} onClick={showNextStep}>
              Start Building
            </button>
          </div>
        </nav>
      </header>
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
      <button
        className={styles.playback}
        onClick={togglePlayback}
        aria-label={
          playing ? "Pause background video" : "Play background video"
        }
        title={playing ? "Pause background video" : "Play background video"}
      >
        {playing ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="2" height="10" rx="1" />
            <rect x="10" y="3" width="2" height="10" rx="1" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 3v10l8-5-8-5Z" />
          </svg>
        )}
      </button>
    </section>
  );
}
