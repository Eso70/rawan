"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./toolkit-section.module.css";
import { ConnectionsCanvas } from "./connections-canvas";

const features = [
  {
    id: "organize",
    title: "Organize Your World",
    description:
      "Give all your characters, places, and things a home. Build rich entries for every element of your world and iterate as your vision evolves.",
  },
  {
    id: "map",
    title: "Create Interactive Maps",
    description:
      "Bring your world to life with zones, markers, regions, and labels. Let your audience explore every corner of your geography.",
  },
  {
    id: "connections",
    title: "Visualize Connections",
    description:
      "See how everything in your world fits together. Map relationships between characters, factions, and events to understand the bigger picture.",
  },
  {
    id: "wiki",
    title: "Create a Custom Wiki",
    description:
      "Publish a home for your world's stories. Choose the look of your wiki, organize its pages, and share your lore with readers and players.",
  },
];

function FeatureIcon({ id }: { id: string }) {
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
      {id === "connections" ? (
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

function DemoVideo({ id, title }: { id: string; title: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const updateControl = () => {
      const element = frame.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty(
        "--control-right",
        `${Math.max(14, rect.right - window.innerWidth + 24)}px`,
      );
    };
    updateControl();
    window.addEventListener("resize", updateControl);
    return () => window.removeEventListener("resize", updateControl);
  }, []);

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
      if (visible && !preference.matches && !manuallyPaused.current) {
        element.play().catch(() => setPlaying(false));
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
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
      element.pause();
    };
  }, [loaded]);

  function toggle() {
    const element = video.current;
    if (!element) return;
    manuallyPaused.current = !element.paused;
    if (element.paused) element.play().catch(() => setPlaying(false));
    else element.pause();
  }

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
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
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
      <button
        className={styles.playback}
        onClick={toggle}
        disabled={!loaded}
        aria-label={`${playing ? "Pause" : "Play"} ${title} video`}
      >
        {playing ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="4" y="3" width="2" height="10" />
            <rect x="10" y="3" width="2" height="10" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 3v10l8-5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function ToolkitSection() {
  const panels = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const scroller = useRef<Lenis | null>(null);
  const selectionLocked = useRef(false);
  const selectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      scroller.current?.destroy();
      scroller.current = null;
      if (
        preference.matches ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
      )
        return;
      scroller.current = new Lenis({
        autoRaf: true,
        duration: 1.2,
        easing: (value) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
        smoothWheel: true,
      });
    };
    sync();
    preference.addEventListener("change", sync);
    return () => {
      scroller.current?.destroy();
      preference.removeEventListener("change", sync);
      if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (selectionLocked.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = panels.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) setActive(index);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    panels.current.forEach((panel) => {
      if (panel) observer.observe(panel);
    });
    const unlock = () => {
      selectionLocked.current = false;
    };
    window.addEventListener("wheel", unlock, { passive: true });
    window.addEventListener("touchmove", unlock, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", unlock);
      window.removeEventListener("touchmove", unlock);
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scheduled = 0;
    const update = () => {
      scheduled = 0;
      panels.current.forEach((panel) => {
        if (!panel) return;
        const frame = panel.querySelector<HTMLDivElement>(`.${styles.frame}`);
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const progress = Math.min(
          1,
          Math.max(
            0,
            (window.innerHeight - rect.top) /
              ((window.innerHeight + rect.height) / 2),
          ),
        );
        panel.style.setProperty(
          "--reveal-opacity",
          preference.matches
            ? "1"
            : String(
                progress <= 0.5
                  ? 0.3 + progress * 0.8
                  : 0.7 + (progress - 0.5) * 0.6,
              ),
        );
        panel.style.setProperty(
          "--reveal-offset",
          preference.matches ? "0px" : `${(1 - progress) * 30}px`,
        );
      });
    };
    const schedule = () => {
      if (!scheduled) scheduled = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
      cancelAnimationFrame(scheduled);
    };
  }, []);

  function select(index: number) {
    const panel = panels.current[index];
    if (!panel) return;
    selectionLocked.current = true;
    setActive(index);
    if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    selectionTimeout.current = setTimeout(() => {
      selectionLocked.current = false;
    }, 1000);
    const rect = panel.getBoundingClientRect();
    const top =
      window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
    if (scroller.current) {
      scroller.current.scrollTo(top);
      return;
    }
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <section
      className={styles.section}
      aria-labelledby="toolkit-title"
      id="toolkit"
    >
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.sticky}>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V4h8v3M3 12h18M8 10v4M16 10v4" />
                </svg>
                The Toolkit
              </span>
              <h2 id="toolkit-title">Everything you need, in one place</h2>
            </div>
            <nav className={styles.featureList} aria-label="Toolkit features">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  className={`${styles.card} ${active === index ? styles.active : ""}`}
                  aria-pressed={active === index}
                  aria-controls={`toolkit-${feature.id}`}
                  onClick={() => select(index)}
                  data-feature={feature.id}
                >
                  <span className={styles.cardTitle}>
                    <motion.span
                      className={`${styles.icon} ${feature.id === "map" ? styles.mapIcon : feature.id === "wiki" ? styles.wikiIcon : feature.id === "connections" ? styles.connectionsIcon : ""}`}
                      animate={{
                        width: active === index ? 28 : 24,
                        height: active === index ? 28 : 24,
                      }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: 520,
                              damping: 30,
                              mass: 0.7,
                            }
                      }
                    >
                      <FeatureIcon id={feature.id} />
                    </motion.span>
                    {feature.title}
                  </span>
                  <AnimatePresence initial={false}>
                    {active === index && (
                      <motion.span
                        className={styles.cardDetails}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                height: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 36,
                                  mass: 1,
                                },
                                opacity: {
                                  duration: 0.24,
                                  ease: [0.22, 1, 0.36, 1],
                                  delay: 0.12,
                                },
                              }
                        }
                      >
                        <span>{feature.description}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className={styles.previews}>
          {features.map((feature, index) => (
            <article
              key={feature.id}
              id={`toolkit-${feature.id}`}
              ref={(element) => {
                panels.current[index] = element;
              }}
              className={styles.panel}
              aria-labelledby={`title-${feature.id}`}
            >
              <div className={styles.mobileCopy}>
                <h3 id={`title-${feature.id}`}>
                  <span
                    className={`${styles.icon} ${feature.id === "map" ? styles.mapIcon : feature.id === "wiki" ? styles.wikiIcon : feature.id === "connections" ? styles.connectionsIcon : ""}`}
                  >
                    <FeatureIcon id={feature.id} />
                  </span>
                  {feature.title}
                </h3>
                <p>{feature.description}</p>
              </div>
              {feature.id === "connections" ? (
                <ConnectionsCanvas className={styles.frame} />
              ) : (
                <DemoVideo id={feature.id} title={feature.title} />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
