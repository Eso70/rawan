"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { WorldScene } from "./creators-world-scene";
import styles from "./creators-section.module.css";
const headlines = [
  "It starts with a spark",
  "That turns into a place",
  "That grows into a world",
];
function subscribe(callback: () => void) {
  const media = window.matchMedia("(max-width: 1023px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const mobileSnapshot = () => window.matchMedia("(max-width: 1023px)").matches;
export function CreatorsSection() {
  const section = useRef<HTMLElement>(null);
  const mobile = useSyncExternalStore(subscribe, mobileSnapshot, () => false);
  const reduced = !!useReducedMotion();
  const [phase, setPhase] = useState(0);
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  });
  useMotionValueEvent(scrollYProgress, "change", (value) =>
    setPhase(value >= 0.66 ? 2 : value >= 0.33 ? 1 : 0),
  );
  return (
    <section
      ref={section}
      id="creators"
      className={styles.section}
      aria-label="From a spark to a world"
    >
      <div className={styles.sticky}>
        <div className={styles.layout}>
          <div className={styles.headline}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={reduced ? 2 : phase}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                {headlines[reduced ? 2 : phase]}
              </motion.h2>
            </AnimatePresence>
          </div>
          <div className={styles.visual}>
            <WorldScene
              progress={scrollYProgress}
              mobile={mobile}
              reduced={reduced}
              phase={phase}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
