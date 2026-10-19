export const studioTools = [
  "works",
  "manuscript",
  "world",
  "plot",
  "timeline",
  "relationships",
  "canvas",
  "research",
  "media",
  "settings",
] as const;
export type StudioRoute =
  | {
      page:
        | "dashboard"
        | "projects"
        | "activity"
        | "search"
        | "preferences"
        | "help"
        | "not-found";
    }
  | { page: "project"; projectId: string; tool: string; entityId?: string };
export function resolveStudioRoute(path: string[] = []): StudioRoute {
  if (!path.length) return { page: "dashboard" };
  if (
    path.length === 1 &&
    ["projects", "activity", "search", "preferences", "help"].includes(path[0])
  )
    return {
      page: path[0] as
        "projects" | "activity" | "search" | "preferences" | "help",
    };
  if (path[0] === "projects" && path[1] && path.length <= 4) {
    const tool = path[2] ?? "overview";
    if (
      (tool === "overview" && path.length === 2) ||
      (studioTools.includes(tool as (typeof studioTools)[number]) &&
        (path.length <= 3 || tool === "world"))
    )
      return { page: "project", projectId: path[1], tool, entityId: path[3] };
  }
  return { page: "not-found" };
}
