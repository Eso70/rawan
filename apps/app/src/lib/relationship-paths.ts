import type {
  WorldEntityKind,
  WorldEntityReference,
  WorldKind,
} from "@rawan/types";
import { worldPage } from "./world-paths";
export const entityCollections: Record<WorldEntityKind, WorldKind> = {
  CHARACTER: "characters",
  PLACE: "places",
  FACTION: "factions",
  ARTIFACT: "artifacts",
};
export function relationshipCollection(
  projectId: string,
  entity?: WorldEntityReference,
) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(projectId))
    throw new Error("Invalid project ID");
  const path = `/projects/${projectId}/relationships`;
  if (!entity) return path;
  if (
    !(entity.kind in entityCollections) ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(entity.id)
  )
    throw new Error("Invalid entity");
  return `${path}?entityKind=${entity.kind}&entityId=${entity.id}`;
}
export function entityPage(projectId: string, entity: WorldEntityReference) {
  return worldPage(projectId, entityCollections[entity.kind], entity.id);
}
export function parseEntity(
  value: FormDataEntryValue | null,
): WorldEntityReference | undefined {
  if (typeof value !== "string") return undefined;
  const [kind, id, ...extra] = value.split(":");
  if (
    extra.length ||
    !Object.hasOwn(entityCollections, kind) ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(id || "")
  )
    return undefined;
  return { kind: kind as WorldEntityKind, id };
}
