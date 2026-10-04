import type { WorldKind } from "@rawan/types";
export const worldKinds: WorldKind[] = [
  "characters",
  "places",
  "factions",
  "artifacts",
];
export function worldKind(value: string): WorldKind {
  if (!worldKinds.includes(value as WorldKind))
    throw new Error("Invalid world collection");
  return value as WorldKind;
}
function id(value: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(value))
    throw new Error("Invalid resource ID");
  return value;
}
export function worldCollection(projectId: string, kind: WorldKind) {
  return `/projects/${id(projectId)}/${worldKind(kind)}`;
}
export function worldResource(kind: WorldKind, entityId: string) {
  return `/${worldKind(kind)}/${id(entityId)}`;
}
export function worldPage(
  projectId: string,
  kind: WorldKind,
  entityId?: string,
) {
  return (
    worldCollection(projectId, kind) + (entityId ? `/${id(entityId)}` : "")
  );
}
