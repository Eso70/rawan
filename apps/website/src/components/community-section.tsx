"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconUsers } from "@tabler/icons-react";
import { genres, tiles } from "./community/community-data";
import { Reel } from "./community/community-reel";
import styles from "./community-section.module.css";
import { usePageVisible } from "./use-page-visible";

export function CommunitySection() {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(24);
  const [genreIndex, setGenreIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  const genre = genres[genreIndex % genres.length];
  const GenreIcon = genre.icon;
  const running = visible && pageVisible && !reduced;

  function step(direction: number) {
    setActive((value) => value + direction);
    setGenreIndex((value) => value + 1);
  }
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(element);
    const resize = () =>
      setVisibleCount(
        Math.max(
          3,
          Math.ceil(
            (window.innerWidth -
              Math.max(32, (window.innerWidth - 960) / 2) -
              7.2) /
              264,
          ) + 1,
        ),
      );
    resize();
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => step(1), 4000);
    return () => clearTimeout(timer);
  }, [active, running]);
  useEffect(() => {
    if (active >= 11 && active < 44) return;
    let first = 0;
    let second = 0;
    const timer = setTimeout(() => {
      setAnimate(false);
      setActive((value) => value + (value >= 44 ? -22 : 22));
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setAnimate(true));
      });
    }, 700);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [active]);

  return (
    <section
      ref={section}
      className={styles.section}
      id="community"
      aria-labelledby="community-title"
    >
      <div className={styles.heading}>
        <span className={styles.eyebrow}>
          <IconUsers size={14} stroke={1.5} aria-hidden="true" />
          Community
        </span>
        <h2 id="community-title">
          Join 250,000+ creators telling{" "}
          <motion.span
            key={genre.name}
            className={styles.genreMotion}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 420,
                    damping: 26,
                    mass: 0.9,
                    opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                  }
            }
          >
            <span
              className={styles.genre}
              style={{
                color: genre.text,
                borderColor: genre.border,
                backgroundColor: `${genre.border}45`,
              }}
            >
              <GenreIcon
                stroke={1.5}
                aria-hidden="true"
                style={{ color: genre.color }}
              />
              {genre.name}
            </span>
          </motion.span>{" "}
          stories
        </h2>
      </div>
      <div
        className={styles.viewport}
        role="region"
        aria-label="Community reels"
        aria-roledescription="carousel"
      >
        <motion.div
          className={styles.track}
          animate={{
            x: `calc(max(32px, (100vw - 1008px) / 2) + 7.2px - ${264 * active}px)`,
          }}
          transition={
            animate && !reduced
              ? { type: "spring", stiffness: 300, damping: 36, mass: 1 }
              : { duration: 0 }
          }
        >
          {tiles.map((id, index) => {
            const offset = index - active;
            const distance = Math.abs(offset);
            const brightness = Math.max(
              0.1,
              1 - distance * (offset < 0 ? 0.55 : 0.3),
            );
            const saturation = Math.max(
              0.2,
              1 - distance * (offset < 0 ? 0.55 : 0.4),
            );
            const highlighted = index === active;
            const near = offset >= -3 && offset <= visibleCount;
            return (
              <button
                key={index}
                type="button"
                className={styles.tile}
                data-reel-tile={`reel-${id}`}
                aria-label={`Community reel ${Number(id)}${index === active ? ", selected" : ""}`}
                aria-hidden={!near}
                aria-pressed={index === active}
                tabIndex={near ? 0 : -1}
                onClick={() => {
                  if (index === active) return;
                  setActive(index);
                  setGenreIndex((value) => value + 1);
                }}
                style={{
                  filter: `brightness(${highlighted ? 1 : brightness}) saturate(${highlighted ? 1 : saturation})`,
                  transform: `scale(${index === active ? 1.06 : 1})`,
                }}
              >
                {near && (
                  <Reel
                    id={id}
                    active={index === active}
                    playing={visible && !reduced}
                    load={visible}
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
