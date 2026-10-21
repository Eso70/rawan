"use client";
import { useEffect, useState } from "react";
import { backgroundIdFromResponse, studioBackgrounds } from "./backgrounds";

export function useStudioAtmosphere() {
  const [background, setBackground] = useState<string | null>(null);
  const [backgroundSrc, setBackgroundSrc] = useState<string | null>(null);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    const refresh = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch("/api/studio/background", { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const id = backgroundIdFromResponse(await response.json());
          if (!stopped && id) setBackground(id);
        }
      } catch { /* Optional artwork never blocks the Studio. */ }
      finally {
        clearTimeout(timeout);
        if (!stopped) timer = setTimeout(() => { void refresh(); }, 300000);
      }
    };
    void refresh();
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); };
  }, []);
  useEffect(() => {
    const scene = studioBackgrounds.find((item) => item.id === background);
    if (!scene) return;
    let active = true;
    const image = new Image();
    image.onload = () => { if (active) setBackgroundSrc(scene.src); };
    image.src = scene.src;
    return () => { active = false; image.onload = null; };
  }, [background]);
  return backgroundSrc;
}
