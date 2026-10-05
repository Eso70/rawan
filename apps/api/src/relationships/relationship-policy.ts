import type { RelationshipDirection, WorldEntityReference } from '@rawan/types';

export function normalizeTypeKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}
export function canonicalEndpoints(
  source: WorldEntityReference,
  target: WorldEntityReference,
  direction: RelationshipDirection,
) {
  if (source.kind === target.kind && source.id === target.id)
    throw new Error('Self relationships are not supported');
  if (
    direction === 'SYMMETRIC' &&
    `${source.kind}:${source.id}` > `${target.kind}:${target.id}`
  )
    return { source: target, target: source };
  return { source, target };
}
