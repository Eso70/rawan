import type { Prisma, Plot } from '@rawan/database';
import {
  MAX_DETAIL_ASSOCIATIONS,
  requireBoundedDetails,
} from '../query/detail-bounds.js';
import type {
  ApiPlot,
  ApiPlotSummary,
  ApiPlotPoint,
  ApiPlotPointSummary,
  ApiPlotPointScene,
  ApiPlotPointEvent,
  ApiPlotPointEntity,
} from '@rawan/types';
export const plotSelect = {
  id: true,
  projectId: true,
  title: true,
  category: true,
  position: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlotSelect;
export const pointSelect = {
  id: true,
  projectId: true,
  plotId: true,
  title: true,
  position: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PlotPointSelect;
export const sceneInclude = {
  scene: {
    select: {
      id: true,
      title: true,
      chapter: {
        select: {
          id: true,
          title: true,
          book: { select: { id: true, title: true } },
        },
      },
    },
  },
} satisfies Prisma.PlotPointSceneInclude;
export const eventInclude = {
  event: {
    select: {
      id: true,
      title: true,
      timelineId: true,
      start: true,
      end: true,
      dateLabel: true,
    },
  },
} satisfies Prisma.PlotPointEventInclude;
const name = { select: { id: true, name: true } } as const;
export const entityInclude = {
  character: name,
  place: name,
  faction: name,
  artifact: name,
} satisfies Prisma.PlotPointEntityInclude;
export const pointInclude = {
  scenes: {
    include: sceneInclude,
    orderBy: { id: 'asc' as const },
    take: MAX_DETAIL_ASSOCIATIONS + 1,
  },
  events: {
    include: eventInclude,
    orderBy: { id: 'asc' as const },
    take: MAX_DETAIL_ASSOCIATIONS + 1,
  },
  entities: {
    include: entityInclude,
    orderBy: { id: 'asc' as const },
    take: MAX_DETAIL_ASSOCIATIONS + 1,
  },
} satisfies Prisma.PlotPointInclude;
export function plotSummary(
  row: Prisma.PlotGetPayload<{ select: typeof plotSelect }>,
): ApiPlotSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    category: row.category,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function plotResponse(row: Plot): ApiPlot {
  return { ...plotSummary(row), description: row.description };
}
export function pointSummary(
  row: Prisma.PlotPointGetPayload<{ select: typeof pointSelect }>,
): ApiPlotPointSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    plotId: row.plotId,
    title: row.title,
    position: row.position,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function sceneResponse(
  row: Prisma.PlotPointSceneGetPayload<{ include: typeof sceneInclude }>,
): ApiPlotPointScene {
  return { associationId: row.id, scene: row.scene };
}
export function eventResponse(
  row: Prisma.PlotPointEventGetPayload<{ include: typeof eventInclude }>,
): ApiPlotPointEvent {
  return {
    associationId: row.id,
    event: {
      id: row.event.id,
      title: row.event.title,
      timelineId: row.event.timelineId,
      start: row.event.start.toFixed(),
      end: row.event.end?.toFixed() ?? null,
      dateLabel: row.event.dateLabel,
    },
  };
}
export function entityResponse(
  row: Prisma.PlotPointEntityGetPayload<{ include: typeof entityInclude }>,
): ApiPlotPointEntity {
  const entity = {
    CHARACTER: row.character,
    PLACE: row.place,
    FACTION: row.faction,
    ARTIFACT: row.artifact,
  }[row.kind];
  if (!entity) throw new Error('Plot entity integrity violation');
  return {
    associationId: row.id,
    entity: { id: entity.id, kind: row.kind, name: entity.name },
    role: row.role,
  };
}
export function pointResponse(
  row: Prisma.PlotPointGetPayload<{ include: typeof pointInclude }>,
): ApiPlotPoint {
  requireBoundedDetails(row.scenes, row.events, row.entities);
  return {
    ...pointSummary(row),
    description: row.description,
    scenes: row.scenes.map(sceneResponse),
    events: row.events.map(eventResponse),
    entities: row.entities.map(entityResponse),
  };
}
