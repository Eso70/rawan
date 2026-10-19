"use client";
import { useEffect, useReducer, useRef } from "react";
import type { SetupStep } from "@rawan/types/onboarding";
import {
  backgroundReducer,
  initialBackground,
  scenes,
  stepScenes,
} from "../background";
import styles from "./onboarding-background.module.css";

export function OnboardingBackground({ step }: { step: SetupStep }) {
  const requested = stepScenes[step];
  const images = useRef<Partial<Record<keyof typeof scenes, HTMLImageElement>>>(
    {},
  );
  const [state, dispatch] = useReducer(
    backgroundReducer,
    requested,
    initialBackground,
  );
  useEffect(() => {
    dispatch({ type: "request", scene: requested });
    // Cached media can finish before hydration attaches load listeners.
    const image = images.current[requested];
    if (image?.complete)
      dispatch({
        type: image.naturalWidth > 0 ? "loaded" : "failed",
        scene: requested,
      });
  }, [requested]);
  return (
    <div
      className={styles.background}
      aria-hidden="true"
      data-scene={requested}
      data-media-state={
        state.failed.includes(requested)
          ? "fallback"
          : state.visible === requested
            ? "ready"
            : "loading"
      }
    >
      {Object.values(scenes)
        .filter(
          (scene) => scene.id === requested || state.loaded.includes(scene.id),
        )
        .map((scene) => (
          <picture
            key={scene.id}
            className={styles.layer}
            data-visible={state.visible === scene.id}
          >
            <source media="(max-width: 767px)" srcSet={scene.mobile} />
            <img
              src={scene.src}
              alt=""
              width={1600}
              height={900}
              className={styles.image}
              loading="eager"
              decoding="async"
              fetchPriority="low"
              ref={(image) => {
                if (image) images.current[scene.id] = image;
                else delete images.current[scene.id];
              }}
              onLoad={() => dispatch({ type: "loaded", scene: scene.id })}
              onError={() => dispatch({ type: "failed", scene: scene.id })}
            />
          </picture>
        ))}
      <div className={styles.shade} />
    </div>
  );
}
