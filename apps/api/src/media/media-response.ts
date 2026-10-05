import type { Media, Prisma } from '@rawan/database';
import type { ApiMedia, ApiMediaAttachment } from '@rawan/types';
export function mediaResponse(row: Media): ApiMedia {
  return {
    id: row.id,
    projectId: row.projectId,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    sha256: row.sha256,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
export function attachmentResponse(
  row: Prisma.MediaAttachmentGetPayload<{ include: { media: true } }>,
): ApiMediaAttachment {
  return {
    id: row.id,
    media: mediaResponse(row.media),
    resource: {
      kind: row.resourceKind,
      id:
        row.noteId ??
        row.characterId ??
        row.placeId ??
        row.factionId ??
        row.artifactId ??
        row.projectId,
    },
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}
