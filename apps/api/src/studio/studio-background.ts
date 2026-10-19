/** Automatic ambient artwork, based only on the API's UTC clock (northern seasons). */
export function studioBackground(now = new Date()) {
  const month = now.getUTCMonth();
  const hour = now.getUTCHours();
  let backgroundId: string;
  if (month >= 2 && month <= 4) {
    backgroundId =
      hour >= 5 && hour < 10
        ? 'spring-dawn'
        : hour >= 10 && hour < 18
          ? 'spring-rain'
          : 'blue-hour-valley';
  } else if (month >= 5 && month <= 7) {
    backgroundId =
      (hour >= 5 && hour < 9) || (hour >= 17 && hour < 21)
        ? 'summer-golden-hour'
        : hour >= 9 && hour < 17
          ? 'summer-noon'
          : 'summer-night';
  } else if (month >= 8 && month <= 10) {
    backgroundId =
      hour >= 5 && hour < 16
        ? 'autumn-morning'
        : hour >= 16
          ? 'autumn-evening'
          : 'blue-hour-valley';
  } else {
    backgroundId = hour >= 5 && hour < 16 ? 'winter-dawn' : 'winter-night';
  }
  return { backgroundId, refreshAfterSeconds: 300 };
}
