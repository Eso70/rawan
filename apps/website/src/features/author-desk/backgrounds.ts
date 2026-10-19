export const studioBackgrounds = [
  {
    id: "spring-dawn",
    label: "Spring dawn",
    season: "Spring",
    time: "Dawn",
    src: "/assets/studio/backgrounds/spring-dawn.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/spring-dawn.webp",
  },
  {
    id: "spring-rain",
    label: "Spring rain",
    season: "Spring",
    time: "Afternoon",
    src: "/assets/studio/backgrounds/spring-rain.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/spring-rain.webp",
  },
  {
    id: "summer-noon",
    label: "Summer coast",
    season: "Summer",
    time: "Noon",
    src: "/assets/studio/backgrounds/summer-noon.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/summer-noon.webp",
  },
  {
    id: "summer-golden-hour",
    label: "Summer golden hour",
    season: "Summer",
    time: "Sunset",
    src: "/assets/studio/backgrounds/summer-golden-hour.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/summer-golden-hour.webp",
  },
  {
    id: "summer-night",
    label: "Summer starlight",
    season: "Summer",
    time: "Night",
    src: "/assets/studio/backgrounds/summer-night.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/summer-night.webp",
  },
  {
    id: "autumn-morning",
    label: "Autumn mist",
    season: "Autumn",
    time: "Morning",
    src: "/assets/studio/backgrounds/autumn-morning.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/autumn-morning.webp",
  },
  {
    id: "autumn-evening",
    label: "Autumn evening",
    season: "Autumn",
    time: "Evening",
    src: "/assets/studio/backgrounds/autumn-evening.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/autumn-evening.webp",
  },
  {
    id: "winter-dawn",
    label: "Winter dawn",
    season: "Winter",
    time: "Dawn",
    src: "/assets/studio/backgrounds/winter-dawn.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/winter-dawn.webp",
  },
  {
    id: "winter-night",
    label: "Winter moonlight",
    season: "Winter",
    time: "Night",
    src: "/assets/studio/backgrounds/winter-night.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/winter-night.webp",
  },
  {
    id: "blue-hour-valley",
    label: "Blue hour valley",
    season: "All seasons",
    time: "Twilight",
    src: "/assets/studio/backgrounds/blue-hour-valley.webp",
    thumbnail: "/assets/studio/backgrounds/thumbnails/blue-hour-valley.webp",
  },
] as const;

export function backgroundIdFromResponse(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("backgroundId" in value))
    return null;
  return studioBackgrounds.some((scene) => scene.id === value.backgroundId)
    ? (value.backgroundId as string)
    : null;
}
