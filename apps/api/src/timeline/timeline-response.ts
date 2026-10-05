import type { Prisma, Timeline, Era } from '@rawan/database';
import {
  MAX_DETAIL_ASSOCIATIONS,
  requireBoundedDetails,
} from '../query/detail-bounds.js';
import type {
  ApiTimeline,
  ApiEra,
  ApiEventSummary,
  ApiTimelineEvent,
  ApiEventEntity,
} from '@rawan/types';
const name = { select: { id: true, name: true } } as const;
export const entityInclude = {
  character: name,
  place: name,
  faction: name,
  artifact: name,
} satisfies Prisma.EventEntityInclude;
export const eventSelect = {
  id: true,
  projectId: true,
  timelineId: true,
  title: true,
  summary: true,
  start: true,
  end: true,
  dateLabel: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  era: name,
} satisfies Prisma.TimelineEventSelect;
export const eventInclude = {
  era: name,
  entities: {
    include: entityInclude,
    orderBy: { id: 'asc' as const },
    take: MAX_DETAIL_ASSOCIATIONS + 1,
  },
} satisfies Prisma.TimelineEventInclude;
export function timelineResponse(row: Timeline): ApiTimeline {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function eraResponse(row: Era): ApiEra {
  return {
    id: row.id,
    timelineId: row.timelineId,
    name: row.name,
    description: row.description,
    position: row.position,
    start: row.start?.toFixed() ?? null,
    end: row.end?.toFixed() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function entityResponse(
  row: Prisma.EventEntityGetPayload<{ include: typeof entityInclude }>,
): ApiEventEntity {
  const entity = {
    CHARACTER: row.character,
    PLACE: row.place,
    FACTION: row.faction,
    ARTIFACT: row.artifact,
  }[row.kind];
  if (!entity) throw new Error('Event entity integrity violation');
  return {
    associationId: row.id,
    entity: { id: entity.id, kind: row.kind, name: entity.name },
    role: row.role,
  };
}
export function eventSummary(
  row: Prisma.TimelineEventGetPayload<{ select: typeof eventSelect }>,
): ApiEventSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    timelineId: row.timelineId,
    title: row.title,
    summary: row.summary,
    start: row.start.toFixed(),
    end: row.end?.toFixed() ?? null,
    dateLabel: row.dateLabel,
    position: row.position,
    era: row.era,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function eventResponse(
  row: Prisma.TimelineEventGetPayload<{ include: typeof eventInclude }>,
): ApiTimelineEvent {
  requireBoundedDetails(row.entities);
  return {
    ...eventSummary(row),
    description: row.description,
    entities: row.entities.map(entityResponse),
  };
}
