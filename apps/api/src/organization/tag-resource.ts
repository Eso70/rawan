import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@rawan/database';
import type { TagResourceKind } from '@rawan/types';
import { requireWorldEntity } from '../worldbuilding/world-entity-access.js';
import { organizationOwner } from './organization-access.js';
const fields = {
  NOTE: 'noteId',
  CHARACTER: 'characterId',
  PLACE: 'placeId',
  FACTION: 'factionId',
  ARTIFACT: 'artifactId',
  SCENE: 'sceneId',
  TIMELINE_EVENT: 'eventId',
  PLOT_POINT: 'plotPointId',
} as const;
export function resourceWhere(
  kind: TagResourceKind,
  id: string,
): Prisma.TagAssignmentWhereInput {
  if (!Object.hasOwn(fields, kind))
    throw new BadRequestException('Unsupported tag resource kind');
  return { resourceKind: kind, [fields[kind]]: id };
}
export async function resolveTagResource(
  db: Prisma.TransactionClient,
  userId: string,
  projectId: string,
  kind: TagResourceKind,
  id: string,
) {
  resourceWhere(kind, id);
  const data = {
    resourceKind: kind,
    noteId: kind === 'NOTE' ? id : null,
    characterId: kind === 'CHARACTER' ? id : null,
    placeId: kind === 'PLACE' ? id : null,
    factionId: kind === 'FACTION' ? id : null,
    artifactId: kind === 'ARTIFACT' ? id : null,
    sceneId: kind === 'SCENE' ? id : null,
    eventId: kind === 'TIMELINE_EVENT' ? id : null,
    plotPointId: kind === 'PLOT_POINT' ? id : null,
    bookId: null as string | null,
    chapterId: null as string | null,
  };
  const query = {
    where: { id, projectId, ...organizationOwner(userId) },
    select: { id: true },
  };
  let found;
  switch (kind) {
    case 'CHARACTER':
    case 'PLACE':
    case 'FACTION':
    case 'ARTIFACT':
      await requireWorldEntity(db, userId, projectId, { kind, id });
      return data;
    case 'NOTE':
      found = await db.note.findFirst(query);
      break;
    case 'TIMELINE_EVENT':
      found = await db.timelineEvent.findFirst({
        where: { id, projectId, timeline: organizationOwner(userId) },
        select: { id: true },
      });
      break;
    case 'PLOT_POINT':
      found = await db.plotPoint.findFirst({
        where: { id, projectId, plot: organizationOwner(userId) },
        select: { id: true },
      });
      break;
    case 'SCENE': {
      const scene = await db.scene.findFirst({
        where: {
          id,
          chapter: { book: { projectId, ...organizationOwner(userId) } },
        },
        select: {
          id: true,
          chapterId: true,
          chapter: { select: { bookId: true } },
        },
      });
      if (!scene)
        throw new NotFoundException('Scene not found in this project');
      return {
        ...data,
        bookId: scene.chapter.bookId,
        chapterId: scene.chapterId,
      };
    }
  }
  if (!found) throw new NotFoundException('Resource not found in this project');
  return data;
}
