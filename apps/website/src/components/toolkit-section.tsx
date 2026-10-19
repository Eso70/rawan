"use client";

import { useEffect, useRef, useState } from "react";
import { useLandingScroll } from "./landing-scroll";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./toolkit-section.module.css";
import { FeatureIcon, DemoVideo } from "./toolkit/toolkit-media";
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
  {
    id: "collaborate",
    title: "Collaborate in Real Time",
    description:
      "Bring your writing team into one shared world. Develop your stories together, keep ideas connected, and make progress side by side.",
  },
];

export function ToolkitSection() {
  const panels = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const scroller = useLandingScroll();
  const selectionLocked = useRef(false);
  const selectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (selectionTimeout.current) clearTimeout(selectionTimeout.current);
    },
    [],
  );

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
    }, 1500);
    const rect = panel.getBoundingClientRect();
    const top =
      window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
    if (scroller?.current) {
      scroller.current.scrollTo(top, {
        onComplete: () => {
          selectionLocked.current = false;
        },
      });
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
                      className={`${styles.icon} ${feature.id === "map" ? styles.mapIcon : feature.id === "wiki" ? styles.wikiIcon : feature.id === "connections" ? styles.connectionsIcon : feature.id === "collaborate" ? styles.collaborateIcon : ""}`}
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
                    className={`${styles.icon} ${feature.id === "map" ? styles.mapIcon : feature.id === "wiki" ? styles.wikiIcon : feature.id === "connections" ? styles.connectionsIcon : feature.id === "collaborate" ? styles.collaborateIcon : ""}`}
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
