"use client";
import { useEffect, useRef, useState } from "react";
import styles from "../toolkit-section.module.css";
export function FeatureIcon({ id }: { id: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {id === "collaborate" ? (
        <>
          <circle cx="9" cy="7" r="4" />
          <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87" />
        </>
      ) : id === "connections" ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </>
      ) : id === "wiki" ? (
        <path d="m3 5 5 14 4-10 4 10 5-14M2 5h4M18 5h4" />
      ) : id === "map" ? (
        <>
          <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
          <path d="M9 3v15M15 6v15" />
        </>
      ) : (
        <>
          <rect x="8" y="4" width="12" height="16" rx="2" />
          <path d="m5 5-2 1 3 15 3-1M11 9h6M11 13h6" />
        </>
      )}
    </svg>
  );
}

export function DemoVideo({ id, title }: { id: string; title: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element || !loaded) return;
    element.load();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !preference.matches) {
        element.play().catch(() => {});
      } else element.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, [loaded]);

  return (
    <div className={styles.frame} ref={frame}>
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="none"
        poster={`/videos/toolkit/${id}-poster.jpg`}
        aria-label={`${title} demonstration`}
        aria-hidden={!loaded}
      >
        {loaded && (
          <>
            <source
              media="(max-width: 767px)"
              src={`/videos/toolkit/${id}-mobile.mp4`}
              type="video/mp4"
            />
            <source src={`/videos/toolkit/${id}.mp4`} type="video/mp4" />
          </>
        )}
      </video>
    </div>
  );
}
