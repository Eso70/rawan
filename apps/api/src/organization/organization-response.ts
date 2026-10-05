import type { Prisma, Note, Tag } from '@rawan/database';
import type {
  ApiNote,
  ApiNoteSummary,
  ApiTag,
  ApiTagAssignment,
} from '@rawan/types';
export const noteSelect = {
  id: true,
  projectId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NoteSelect;
const title = { select: { id: true, title: true } } as const;
const name = { select: { id: true, name: true } } as const;
export const assignmentInclude = {
  tag: name,
  note: title,
  character: name,
  place: name,
  faction: name,
  artifact: name,
  scene: title,
  event: title,
  plotPoint: title,
} satisfies Prisma.TagAssignmentInclude;
export function noteSummary(
  row: Prisma.NoteGetPayload<{ select: typeof noteSelect }>,
): ApiNoteSummary {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function noteResponse(row: Note): ApiNote {
  return { ...noteSummary(row), content: row.content };
}
export function tagResponse(row: Tag): ApiTag {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function assignmentResponse(
  row: Prisma.TagAssignmentGetPayload<{ include: typeof assignmentInclude }>,
): ApiTagAssignment {
  const resource = {
    NOTE: row.note,
    CHARACTER: row.character,
    PLACE: row.place,
    FACTION: row.faction,
    ARTIFACT: row.artifact,
    SCENE: row.scene,
    TIMELINE_EVENT: row.event,
    PLOT_POINT: row.plotPoint,
  }[row.resourceKind];
  if (!resource) throw new Error('Tag resource integrity violation');
  return {
    assignmentId: row.id,
    tag: { id: row.tag.id, name: row.tag.name },
    resource: {
      kind: row.resourceKind,
      id: resource.id,
      label: 'name' in resource ? resource.name : resource.title,
    },
  };
}
