import type { SetupStep } from "@rawan/types/onboarding";

export const scenes = {
  archive: {
    id: "archive",
    src: "/images/onboarding/archive.webp",
    mobile: "/images/onboarding/archive-mobile.webp",
  },
  garden: {
    id: "garden",
    src: "/images/onboarding/garden.webp",
    mobile: "/images/onboarding/garden-mobile.webp",
  },
  horizon: {
    id: "horizon",
    src: "/images/onboarding/horizon.webp",
    mobile: "/images/onboarding/horizon-mobile.webp",
  },
} as const;
export type SceneId = keyof typeof scenes;
export const stepScenes: Record<SetupStep, SceneId> = {
  welcome: "archive",
  purpose: "archive",
  interests: "garden",
  preferences: "garden",
  begin: "horizon",
};
export type BackgroundState = {
  requested: SceneId;
  visible: SceneId | null;
  loaded: SceneId[];
  failed: SceneId[];
};
export type BackgroundEvent = {
  type: "request" | "loaded" | "failed";
  scene: SceneId;
};
export function initialBackground(scene: SceneId): BackgroundState {
  return { requested: scene, visible: null, loaded: [], failed: [] };
}
/** Decorative loading never controls the form; late image events cannot select an old scene. */
export function backgroundReducer(
  state: BackgroundState,
  event: BackgroundEvent,
): BackgroundState {
  if (event.type === "request")
    return {
      ...state,
      requested: event.scene,
      visible: state.failed.includes(event.scene)
        ? null
        : state.loaded.includes(event.scene)
          ? event.scene
          : state.visible,
    };
  if (event.type === "loaded")
    return {
      ...state,
      loaded: [...new Set([...state.loaded, event.scene])],
      failed: state.failed.filter((scene) => scene !== event.scene),
      visible: state.requested === event.scene ? event.scene : state.visible,
    };
  return {
    ...state,
    failed: [...new Set([...state.failed, event.scene])],
    visible: state.requested === event.scene ? null : state.visible,
  };
}
