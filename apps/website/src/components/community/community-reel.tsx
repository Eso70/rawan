"use client";
import { useEffect, useRef } from "react";
import { startsHalfway } from "./community-data";
import styles from "../community-section.module.css";
export function Reel({
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
