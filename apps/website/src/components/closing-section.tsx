"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconCardsFilled,
  IconTent,
  IconMessages,
  IconCube,
  IconMusic,
  IconListCheck,
  IconBrandYoutube,
  IconSitemap,
  IconBrandSpotify,
  IconFile,
  IconBook,
  IconDice5,
  IconVolume,
  IconPhoto,
  IconPlane,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import { BrandMark } from "./brand-mark";
import styles from "./closing-section.module.css";
import { usePageVisible } from "./use-page-visible";
import { SiteFooter } from "./site-footer";

const tools = [
  { label: "Cards", icon: IconCardsFilled, color: "#34d399" },
  { label: "Camp Wiki", icon: IconTent, color: "#f472b6" },
  { label: "Conversation", icon: IconMessages, color: "#fb923c" },
  { label: "3D Model Viewer", icon: IconCube, color: "#facc15" },
  { label: "Apple Music", icon: IconMusic, color: "#60a5fa" },
  { label: "To-do List", icon: IconListCheck, color: "#34d399" },
  { label: "YouTube", icon: IconBrandYoutube, color: "#f87171" },
  { label: "World Graph", icon: IconSitemap, color: "#a78bfa" },
  { label: "Spotify", icon: IconBrandSpotify, color: "#4ade80" },
  { label: "File Viewer", icon: IconFile, color: "#60a5fa" },
  { label: "Homebrewery", icon: IconBook, color: "#2dcea0" },
  { label: "5e Character Sheet", icon: IconDice5, color: "#f366a4" },
  { label: "Audio", icon: IconVolume, color: "#fb9c30" },
  { label: "Sprite Viewer", icon: IconPhoto, color: "#a78bfa" },
  { label: "Travel", icon: IconPlane, color: "#60a5fa" },
];

export function ClosingSection() {
  const section = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [slots, setSlots] = useState([0, 1, 2, 3, 4]);
  const sequence = useRef(5);
  const slot = useRef(0);
  const [notice, setNotice] = useState("");
  const reduced = useReducedMotion();
  const pageVisible = usePageVisible();
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || !pageVisible || reduced) return;
    const timer = setInterval(() => {
      const nextSlot = slot.current;
      const nextTool = sequence.current;
      setSlots((current) =>
        current.map((value, index) => (index === nextSlot ? nextTool : value)),
      );
      slot.current = (nextSlot + 1) % 5;
      sequence.current = (nextTool + 1) % tools.length;
    }, 2400);
    return () => clearInterval(timer);
  }, [visible, pageVisible, reduced]);
  return (
    <div className={styles.closing}>
      <section
        ref={section}
        id="final-cta"
        className={styles.section}
        aria-labelledby="closing-title"
      >
        <motion.div
          className={styles.content}
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrandMark className={styles.mark} />
          <h2 id="closing-title">Ready to get to work?</h2>
          <div className={styles.showcase} aria-label="Tool examples">
            {slots.map((toolIndex, index) => {
              const tool = tools[toolIndex];
              const ToolIcon = tool.icon;
              return (
                <motion.div
                  key={index}
                  layout={reduced ? false : "position"}
                  className={styles.slot}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={tool.label}
                      className={styles.chip}
                      style={{
                        color: tool.color,
                        borderColor: `${tool.color}4d`,
                        backgroundColor: `${tool.color}14`,
                        boxShadow: `0 0 12px ${tool.color}1a`,
                      }}
                      initial={
                        reduced
                          ? false
                          : { opacity: 0, y: 18, filter: "blur(3px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -12, filter: "blur(3px)" }}
                      transition={{
                        duration: reduced ? 0 : 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <ToolIcon size={14} stroke={1.75} aria-hidden="true" />
                      {tool.label}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.cta}
            onClick={() =>
              setNotice(
                "The writing workspace is coming next. Your stories begin here.",
              )
            }
          >
            Start Building Now
            <IconArrowRight size={17} stroke={1.75} aria-hidden="true" />
          </button>
          <ul className={styles.reassurance}>
            {[
              "Start for free",
              "No credit card required",
              "Cancel anytime",
            ].map((text) => (
              <li key={text}>
                <IconCheck size={14} stroke={1.75} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <p className={styles.notice} role="status" aria-live="polite">
            {notice}
          </p>
        </motion.div>
      </section>
      <SiteFooter />
    </div>
  );
}
