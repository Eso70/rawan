"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import styles from "./manifesto-section.module.css";

const photos = [
  { name: "dog", top: "5%", left: "3%", size: "medium" },
  { name: "camping", top: "8%", left: "28%", size: "large" },
  { name: "snow", top: "12%", right: "18%", size: "medium" },
  { name: "trail", top: "38%", left: "5%", size: "small" },
  { name: "grass", top: "42%", right: "8%", size: "medium" },
  { name: "flowers", top: "65%", left: "22%", size: "small" },
  { name: "sleeping-dog", top: "70%", right: "20%", size: "large" },
  { name: "meadow", top: "88%", left: "6%", size: "medium" },
];
const colors = [
  "#f59e0b",
  "#4ade80",
  "#3b82f6",
  "#ec4899",
  "#a855f7",
  "#ef4444",
];

function RevealLine({
  progress,
  start,
  end,
  children,
  last = false,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  children: ReactNode;
  last?: boolean;
}) {
  const reduced = useReducedMotion();
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const filter = useTransform(
    progress,
    [start, end],
    ["blur(8px)", "blur(0px)"],
  );
  const y = useTransform(progress, [start, end], [20, 0]);
  return (
    <motion.div
      className={last ? undefined : styles.line}
      style={{
        opacity: reduced ? 1 : opacity,
        filter: reduced ? "none" : filter,
        y: reduced ? 0 : y,
      }}
    >
      {children}
    </motion.div>
  );
}

function Underline({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <span className={styles.underlined}>
      {children}
      <svg aria-hidden="true" viewBox="0 0 100 8" preserveAspectRatio="none">
        <motion.path
          d="M1 5.6 C 20 2.9, 44 7.1, 66 4.2 S 92 6.4, 99 4.1"
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduced ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </span>
  );
}

export function ManifestoSection() {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const palette = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const previousPoint = useRef<{ x: number; y: number } | null>(null);
  const [planetOpen, setPlanetOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [painting, setPainting] = useState(false);
  const [paintColor, setPaintColor] = useState(colors[0]);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reduced)
        element.play().catch(() => {});
      else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
      if (!visible || reduced) setPlanetOpen(false);
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, [reduced]);

  useEffect(() => {
    if (!painting && !paletteOpen) return;
    const dismiss = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        palette.current?.contains(event.target)
      )
        return;
      setPaletteOpen(false);
      setPainting(false);
      previousPoint.current = null;
      const element = canvas.current;
      element?.getContext("2d")?.clearRect(0, 0, element.width, element.height);
    };
    document.addEventListener("click", dismiss);
    return () => document.removeEventListener("click", dismiss);
  }, [painting, paletteOpen]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      element.width = window.innerWidth * dpr;
      element.height = window.innerHeight * dpr;
      element.getContext("2d")?.scale(dpr, dpr);
      previousPoint.current = null;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <section
      id="manifesto"
      className={styles.section}
      aria-label="Human creativity and the planet"
    >
      <div className={styles.transitionIn} aria-hidden="true" />
      <div
        ref={stage}
        className={styles.stage}
        onMouseMove={(event) => {
          if (!painting || paletteOpen || reduced) return;
          const context = canvas.current?.getContext("2d");
          if (!context) return;
          const point = { x: event.clientX, y: event.clientY };
          const previous = previousPoint.current;
          if (previous) {
            context.strokeStyle = `${paintColor}66`;
            context.lineWidth = 30;
            context.lineCap = "round";
            context.beginPath();
            context.moveTo(previous.x, previous.y);
            context.lineTo(point.x, point.y);
            context.stroke();
          }
          previousPoint.current = point;
        }}
        onMouseLeave={() => {
          previousPoint.current = null;
        }}
      >
        <div className={styles.sticky}>
          <canvas ref={canvas} className={styles.paint} aria-hidden="true" />
          <div className={styles.copy}>
            <RevealLine progress={scrollYProgress} start={0.05} end={0.2}>
              <p>The world is changing fast.</p>
            </RevealLine>
            <RevealLine progress={scrollYProgress} start={0.2} end={0.35}>
              <p className={styles.flexLine}>
                <span>We&apos;re building for</span>
                <span className={styles.handwriting}>human creativity</span>
              </p>
            </RevealLine>
            <RevealLine progress={scrollYProgress} start={0.35} end={0.5}>
              <div className={styles.flexLine}>
                <span>10% to</span>
                <span ref={palette} className={styles.artists}>
                  <motion.button
                    type="button"
                    className={styles.palette}
                    aria-label="Choose a paint color"
                    aria-expanded={paletteOpen}
                    onClick={() => {
                      setPaletteOpen((value) => !value);
                      setPainting(true);
                    }}
                    animate={{
                      scale: paletteOpen ? 2.5 : 1,
                      x: paletteOpen ? -15 : 0,
                      y: paletteOpen ? -20 : 0,
                      rotate: paletteOpen ? 20 : 0,
                    }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 300, damping: 36 }
                    }
                  >
                    <svg
                      viewBox="0 0 64 64"
                      width={24}
                      height={24}
                      aria-hidden="true"
                    >
                      <path
                        fill={paletteOpen ? "#d4a574" : "#a0724a"}
                        d="M31 3C12 3 1 16 2 34c1 17 16 27 32 26 13-1 25-9 25-16 0-4-4-7-9-6-13 2-16-11-2-13 19-2 12-22-17-22Z"
                      />
                      {colors.map((color, index) => (
                        <circle
                          key={color}
                          cx={[49, 12, 13, 22, 35, 39][index]}
                          cy={[16, 28, 43, 16, 12, 47][index]}
                          r={4.5}
                          fill={color}
                        />
                      ))}
                    </svg>
                  </motion.button>
                  <Underline color={colors[0]}>
                    <button
                      type="button"
                      className={styles.word}
                      onClick={() => {
                        setPaletteOpen(true);
                        setPainting(true);
                      }}
                    >
                      artists
                    </button>
                  </Underline>
                  {paletteOpen && (
                    <div
                      className={styles.swatches}
                      role="group"
                      aria-label="Paint colors"
                    >
                      {colors.map((color, index) => (
                        <button
                          key={color}
                          type="button"
                          style={{ background: color }}
                          aria-label={`Use ${["amber", "green", "blue", "pink", "purple", "red"][index]} paint`}
                          onClick={() => {
                            setPaintColor(color);
                            setPaletteOpen(false);
                            setPainting(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </span>
                <span>, 1% to the</span>
                <button
                  type="button"
                  className={styles.planet}
                  onMouseEnter={() => setPlanetOpen(true)}
                  onMouseLeave={() => setPlanetOpen(false)}
                  onFocus={() => setPlanetOpen(true)}
                  onBlur={() => setPlanetOpen(false)}
                  onClick={() => setPlanetOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setPlanetOpen(false);
                  }}
                  aria-label="Show planet photographs"
                  aria-expanded={planetOpen}
                >
                  <video
                    ref={video}
                    src="/videos/planet/earth-spinning.mp4"
                    poster="/images/planet/earth-poster.jpg"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    disablePictureInPicture
                  />
                  <Underline color={colors[1]}>planet</Underline>
                  <span>.</span>
                </button>
              </div>
            </RevealLine>
            <RevealLine progress={scrollYProgress} start={0.5} end={0.65} last>
              <p>Forever.</p>
            </RevealLine>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {planetOpen &&
          photos.map((photo, index) => (
            <motion.div
              key={photo.name}
              className={styles.photo}
              style={{ top: photo.top, left: photo.left, right: photo.right }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 300,
                      damping: 36,
                      mass: 1,
                      delay: index * 0.04,
                      opacity: { duration: 0.15, delay: index * 0.04 },
                    }
              }
            >
              <div className={styles[photo.size]}>
                <Image
                  src={`/images/planet/${photo.name}.avif`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 336px, 252px"
                />
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
      <div className={styles.transitionOut} aria-hidden="true" />
    </section>
  );
}
