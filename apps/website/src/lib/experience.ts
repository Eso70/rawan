export type Experience = "author" | "reader" | "both" | "explore";
export type Preferences = {
  experience: Experience | null;
  interests: string[];
  goal: string | null;
};
export function dashboardFor(experience: Experience) {
  return experience === "author" || experience === "both"
    ? "/workspace/author"
    : "/workspace/reader";
}
export async function preferencesFor(session: {
  api: string;
  token: string;
}): Promise<Preferences> {
  const response = await fetch(`${session.api}/users/me/onboarding`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Your preferences are unavailable. Please try again.");
  const { experience, interests, goal } = await response.json();
  return { experience, interests, goal };
}
