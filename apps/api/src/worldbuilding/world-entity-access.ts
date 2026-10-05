import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@rawan/database';
import type { WorldEntityReference } from '@rawan/types';

export async function requireWorldEntity(
  db: Prisma.TransactionClient,
  userId: string,
  projectId: string,
  entity: WorldEntityReference,
): Promise<void> {
  const query = {
    where: { id: entity.id, projectId, project: { author: { userId } } },
    select: { id: true },
  };
  let found;
  switch (entity.kind) {
    case 'CHARACTER':
      found = await db.character.findFirst(query);
      break;
    case 'PLACE':
      found = await db.place.findFirst(query);
      break;
    case 'FACTION':
      found = await db.faction.findFirst(query);
      break;
    case 'ARTIFACT':
      found = await db.artifact.findFirst(query);
      break;
    default:
      throw new BadRequestException('Unsupported entity kind');
  }
  if (!found)
    throw new NotFoundException('World entity not found in this project');
}

export function entityFields(entity: WorldEntityReference) {
  return {
    kind: entity.kind,
    characterId: entity.kind === 'CHARACTER' ? entity.id : null,
    placeId: entity.kind === 'PLACE' ? entity.id : null,
    factionId: entity.kind === 'FACTION' ? entity.id : null,
    artifactId: entity.kind === 'ARTIFACT' ? entity.id : null,
  };
}
