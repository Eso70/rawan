"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";
import {
  IconCardsFilled,
  IconFolder,
  IconChevronRight,
  IconSearch,
  IconPlus,
  IconMap,
  IconTag,
  IconShare,
  IconBuilding,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import styles from "./creators-section.module.css";

import { entries, folders, markers } from "./creators-data";

const source = (image: string) => `/images/creators/${image}.avif`;

function SparkCard({
  image,
  progress,
  side = 0,
  mobile,
  reduced,
}: {
  image: string;
  progress: MotionValue<number>;
  side?: number;
  mobile: boolean;
  reduced: boolean;
}) {
  const sideX = useTransform(progress, [0, 0.42], [side * 120, side * 180]);
  const sideY = useTransform(progress, [0, 0.42], [350, -300]);
  const sideRotation = useTransform(progress, [0, 0.42], [side * 6, side * 12]);
  const sideScale = useTransform(progress, [0, 0.42], [0.8, 1]);
  const sideOpacity = useTransform(
    progress,
    [0, 0.03, 0.32, 0.42],
    [0, 0.9, 0.9, 0],
  );
  const centerOpacity = useTransform(
    progress,
    [0.08, 0.14, 0.64, 0.66],
    [0, 1, 1, 0],
  );
  const centerY = useTransform(
    progress,
    [0.08, 0.2, 0.38, 0.5],
    [300, 0, 0, mobile ? -175 : -152],
  );
  const centerX = useTransform(
    progress,
    [0.38, 0.5, 0.66, 0.82],
    [0, mobile ? 85 : 118, mobile ? 85 : 118, mobile ? 195 : 268],
  );
  const centerScale = useTransform(
    progress,
    [0.38, 0.5],
    [1, mobile ? 0.54 : 0.5],
  );
  const centerLayer = useTransform(progress, [0.08, 0.4, 0.42], [60, 60, 55]);
  if (reduced) return null;
  return (
    <motion.div
      className={styles.spark}
      style={{
        x: side ? sideX : centerX,
        y: side ? sideY : centerY,
        rotate: side ? sideRotation : 0,
        scale: side ? sideScale : centerScale,
        opacity: side ? sideOpacity : centerOpacity,
        zIndex: side ? 4 : centerLayer,
      }}
    >
      <div className={styles.sparkImage}>
        <Image
          src={source(image)}
          alt=""
          fill
          sizes="(min-width:1024px) 303px, (min-width:768px) 269px, 219px"
        />
      </div>
    </motion.div>
  );
}

export function WorldScene({
  progress,
  mobile,
  reduced,
  phase,
}: {
  progress: MotionValue<number>;
  mobile: boolean;
  reduced: boolean;
  phase: number;
}) {
  const [selected, setSelected] = useState("outlook");
  const [expanded, setExpanded] = useState(new Set(["places"]));
  const card = entries.find((entry) => entry.id === selected)!;
  const cardY = useTransform(progress, [0.35, 0.48], [400, 0]);
  const cardX = useTransform(progress, [0.66, 0.82], [0, mobile ? 90 : 150]);
  const scale = useTransform(progress, [0.66, 0.82], [1, mobile ? 0.38 : 1]);
  const cardOpacity = useTransform(progress, [0.35, 0.4], [0, 1]);
  const imageOpacity = useTransform(progress, [0.48, 0.52], [0, 1]);
  const navY = useTransform(progress, [0.66, 0.82], [300, 0]);
  const navOpacity = useTransform(progress, [0.66, 0.78], [0, 1]);
  const worldScale = useTransform(
    progress,
    [0.66, 0.82],
    [1, mobile ? 0.38 : 1],
  );
  const interactive = reduced || phase === 2;
  const select = (id: string) => setSelected(id);
  const row = (id: string) => {
    const entry = entries.find((item) => item.id === id)!;
    return (
      <button
        type="button"
        key={id}
        className={`${styles.treeRow} ${selected === id ? styles.selected : ""}`}
        aria-pressed={selected === id}
        onClick={() => select(id)}
        tabIndex={interactive ? 0 : -1}
      >
        <IconCardsFilled size={13} aria-hidden="true" />
        <span>{entry.name}</span>
      </button>
    );
  };
  return (
    <div className={styles.scene}>
      <SparkCard
        image="harbor"
        side={-1}
        progress={progress}
        mobile={mobile}
        reduced={reduced}
      />
      <SparkCard
        image="mirewalker"
        side={1}
        progress={progress}
        mobile={mobile}
        reduced={reduced}
      />
      <SparkCard
        image={card.image}
        progress={progress}
        mobile={mobile}
        reduced={reduced}
      />
      <motion.div
        className={styles.detailPosition}
        style={{
          x: reduced ? (mobile ? 90 : 150) : cardX,
          y: reduced ? 0 : cardY,
          scale: reduced ? (mobile ? 0.38 : 1) : scale,
          opacity: reduced ? 1 : cardOpacity,
        }}
        aria-hidden={!reduced && phase === 0}
      >
        <motion.article
          key={card.id}
          className={styles.detail}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          aria-label={`${card.name} preview`}
        >
          <header className={styles.detailHeader}>
            <div className={styles.fields}>
              <h3>{card.name}</h3>
              <div className={styles.aliases}>
                <span>
                  <IconTag size={13} aria-hidden="true" /> Aliases
                </span>
                <div>
                  {card.aliases.map((alias) => (
                    <span key={alias} className={styles.alias}>
                      {alias}
                      <IconX size={12} aria-hidden="true" />
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.properties}>
                {card.properties.map(([label, value], index) => {
                  const PropertyIcon = [IconShare, IconBuilding, IconUsers][
                    index
                  ];
                  return (
                    <div key={label}>
                      <PropertyIcon size={13} aria-hidden="true" />
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <motion.div
              className={styles.portrait}
              style={{ opacity: reduced ? 1 : imageOpacity }}
            >
              <Image src={source(card.image)} alt="" fill sizes="152px" />
            </motion.div>
          </header>
          <div className={styles.detailBody}>
            {[
              ["Overview", card.overview],
              ["Notes", card.notes],
            ].map(([title, text]) => (
              <section className={styles.note} key={title}>
                <h4>{title}</h4>
                <p>{text}</p>
              </section>
            ))}
          </div>
        </motion.article>
      </motion.div>
      <motion.div
        className={styles.treePosition}
        style={{
          y: reduced ? 0 : navY,
          opacity: reduced ? 1 : navOpacity,
          scale: reduced ? (mobile ? 0.38 : 1) : worldScale,
        }}
        aria-hidden={!interactive}
        inert={!interactive}
      >
        <aside className={styles.tree} aria-label="Example world entries">
          <div className={styles.search}>
            <IconSearch size={13} aria-hidden="true" />
            <span>Search…</span>
            <kbd>⌘K</kbd>
          </div>
          <div className={styles.treeBody}>
            {folders.map((folder) => (
              <div key={folder.id}>
                <button
                  type="button"
                  className={styles.folder}
                  aria-expanded={expanded.has(folder.id)}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(folder.id)) next.delete(folder.id);
                      else next.add(folder.id);
                      return next;
                    })
                  }
                >
                  <IconFolder size={13} aria-hidden="true" />
                  <span>{folder.name}</span>
                  <IconChevronRight
                    size={11}
                    aria-hidden="true"
                    style={{
                      transform: expanded.has(folder.id)
                        ? "rotate(90deg)"
                        : undefined,
                    }}
                  />
                </button>
                {expanded.has(folder.id) && (
                  <div className={styles.children}>{folder.ids.map(row)}</div>
                )}
              </div>
            ))}
            {row("coast")}
            {row("accords")}
            <div className={`${styles.treeRow} ${styles.worldRow}`}>
              <IconMap size={13} aria-hidden="true" /> Lumia
            </div>
          </div>
          <div className={styles.newDocument}>
            <IconPlus size={13} aria-hidden="true" /> New Document
          </div>
        </aside>
      </motion.div>
      <motion.div
        className={styles.mapPosition}
        style={{
          y: reduced ? 0 : navY,
          opacity: reduced ? 1 : navOpacity,
          scale: reduced ? (mobile ? 0.38 : 1) : worldScale,
        }}
        aria-hidden={!interactive}
        inert={!interactive}
      >
        <div className={styles.map} aria-label="Lumia map">
          <Image
            src={source("world-map")}
            alt="Illustrated island map of Lumia"
            fill
            sizes="326px"
          />
          <div className={styles.mapShade} />
          {markers.map((marker) => {
            const entry = entries.find((item) => item.id === marker.id)!;
            return (
              <div
                className={styles.markerPosition}
                key={marker.id}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                <motion.button
                  type="button"
                  aria-label={`Show ${marker.label}`}
                  aria-pressed={selected === marker.id}
                  onClick={() => select(marker.id)}
                  className={styles.marker}
                  whileHover={reduced ? undefined : { scale: 1.08 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                >
                  <span
                    className={
                      selected === marker.id ? styles.activeMarker : ""
                    }
                  >
                    <Image src={source(entry.image)} alt="" fill sizes="34px" />
                  </span>
                  <small>{marker.label}</small>
                </motion.button>
              </div>
            );
          })}
          <div className={styles.mapTools} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((index) => (
              <span key={index}>
                <i />
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
