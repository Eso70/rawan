"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  IconUsers,
  IconSword,
  IconCpu,
  IconBuildingCastle,
  IconGhost3Filled,
  IconSunFilled,
  IconRocket,
  IconHorse,
  IconMoon,
  IconHome,
  IconEye,
  IconBuildingSkyscraper,
  IconTrident,
  IconSettings,
  IconBook,
  IconRadioactiveFilled,
  IconSkull,
  IconTent,
  IconArrowsSplit2,
} from "@tabler/icons-react";
import styles from "./community-section.module.css";
import { usePageVisible } from "./use-page-visible";

const genres = [
  {
    name: "Fantasy",
    icon: IconSword,
    text: "#C3CD8D",
    border: "#697C32",
    color: "#C3CD8D",
  },
  {
    name: "Cyberpunk",
    icon: IconCpu,
    text: "#D4F8F2",
    border: "#9CF0E3",
    color: "#EC47A6",
  },
  {
    name: "Historical",
    icon: IconBuildingCastle,
    text: "#D4A35A",
    border: "#2C2418",
    color: "#D4A35A",
  },
  {
    name: "Horror",
    icon: IconGhost3Filled,
    text: "#EF4444",
    border: "#1A0A0A",
    color: "#EF4444",
  },
  {
    name: "Solarpunk",
    icon: IconSunFilled,
    text: "#4ADE80",
    border: "#0F1F12",
    color: "#FFD700",
  },
  {
    name: "Sci-Fi",
    icon: IconRocket,
    text: "#CCDEC0",
    border: "#11457E",
    color: "#CCDEC0",
  },
  {
    name: "Western",
    icon: IconHorse,
    text: "#DEB887",
    border: "#2A1F15",
    color: "#DEB887",
  },
  {
    name: "Dark Fantasy",
    icon: IconMoon,
    text: "#F4D03F",
    border: "#2F2F2F",
    color: "#F4D03F",
  },
  {
    name: "Cozy",
    icon: IconHome,
    text: "#FFAB76",
    border: "#2A1F1A",
    color: "#FFAB76",
  },
  {
    name: "Dystopian",
    icon: IconEye,
    text: "#FF6B35",
    border: "#1A1512",
    color: "#FF6B35",
  },
  {
    name: "Modern",
    icon: IconBuildingSkyscraper,
    text: "#94A3B8",
    border: "#1E293B",
    color: "#94A3B8",
  },
  {
    name: "Mythology",
    icon: IconTrident,
    text: "#F4D03F",
    border: "#2A2010",
    color: "#F4D03F",
  },
  {
    name: "Steampunk",
    icon: IconSettings,
    text: "#CD7F32",
    border: "#1F1A10",
    color: "#CD7F32",
  },
  {
    name: "Dark Academia",
    icon: IconBook,
    text: "#F5DEB3",
    border: "#722F37",
    color: "#F5DEB3",
  },
  {
    name: "Post-Apocalyptic",
    icon: IconRadioactiveFilled,
    text: "#CD853F",
    border: "#1F1410",
    color: "#E07020",
  },
  {
    name: "Grimdark",
    icon: IconSkull,
    text: "#B22222",
    border: "#1A1A1A",
    color: "#B22222",
  },
  {
    name: "Survival",
    icon: IconTent,
    text: "#ECF6E7",
    border: "#293A1D",
    color: "#ECF6E7",
  },
  {
    name: "Alternate History",
    icon: IconArrowsSplit2,
    text: "#CD853F",
    border: "#1F1510",
    color: "#CD853F",
  },
];
const reels = [
  "02",
  "05",
  "01",
  "08",
  "03",
  "07",
  "04",
  "06",
  "09",
  "10",
  "11",
];
const tiles = Array.from({ length: 5 }, () => reels).flat();
const startsHalfway = new Set(["01", "02", "03", "05", "07"]);

function Reel({
  id,
  active,
  playing,
  load,
}: {
  id: string;
  active: boolean;
  playing: boolean;
  load: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const previousActive = useRef(false);
  useEffect(() => {
    const element = video.current;
    if (!element || !load) return;
    element.load();
  }, [load]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const entering = active && !previousActive.current;
    previousActive.current = active;
    const sync = () => {
      if (entering && Number.isFinite(element.duration))
        element.currentTime = startsHalfway.has(id) ? element.duration / 2 : 0;
      if (active && playing) element.play().catch(() => {});
      else element.pause();
    };
    sync();
    element.addEventListener("loadedmetadata", sync);
    return () => {
      element.removeEventListener("loadedmetadata", sync);
      element.pause();
    };
  }, [active, playing, id, load]);
  return (
    <video
      ref={video}
      className={id === "08" ? styles.landscape : undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      poster={`/videos/community/reel-${id}-poster.jpg`}
    >
      {load && (
        <>
          <source
            media="(max-width: 767px)"
            src={`/videos/community/reel-${id}-mobile.mp4`}
            type="video/mp4"
          />
          <source src={`/videos/community/reel-${id}.mp4`} type="video/mp4" />
        </>
      )}
    </video>
  );
}

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
