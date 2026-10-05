-- CreateEnum
CREATE TYPE "WorldEntityKind" AS ENUM ('CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT');

-- CreateEnum
CREATE TYPE "RelationshipDirection" AS ENUM ('DIRECTIONAL', 'SYMMETRIC');

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceKind" "WorldEntityKind" NOT NULL,
    "targetKind" "WorldEntityKind" NOT NULL,
    "typeKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "direction" "RelationshipDirection" NOT NULL DEFAULT 'DIRECTIONAL',
    "sourceCharacterId" TEXT,
    "sourcePlaceId" TEXT,
    "sourceFactionId" TEXT,
    "sourceArtifactId" TEXT,
    "targetCharacterId" TEXT,
    "targetPlaceId" TEXT,
    "targetFactionId" TEXT,
    "targetArtifactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relationship_projectId_createdAt_idx" ON "Relationship"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Relationship_projectId_sourceCharacterId_idx" ON "Relationship"("projectId", "sourceCharacterId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_sourcePlaceId_idx" ON "Relationship"("projectId", "sourcePlaceId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_sourceFactionId_idx" ON "Relationship"("projectId", "sourceFactionId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_sourceArtifactId_idx" ON "Relationship"("projectId", "sourceArtifactId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_targetCharacterId_idx" ON "Relationship"("projectId", "targetCharacterId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_targetPlaceId_idx" ON "Relationship"("projectId", "targetPlaceId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_targetFactionId_idx" ON "Relationship"("projectId", "targetFactionId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_targetArtifactId_idx" ON "Relationship"("projectId", "targetArtifactId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_projectId_id_key" ON "Character"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Place_projectId_id_key" ON "Place"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Faction_projectId_id_key" ON "Faction"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Artifact_projectId_id_key" ON "Artifact"("projectId", "id");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_sourceCharacterId_fkey" FOREIGN KEY ("projectId", "sourceCharacterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_sourcePlaceId_fkey" FOREIGN KEY ("projectId", "sourcePlaceId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_sourceFactionId_fkey" FOREIGN KEY ("projectId", "sourceFactionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_sourceArtifactId_fkey" FOREIGN KEY ("projectId", "sourceArtifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_targetCharacterId_fkey" FOREIGN KEY ("projectId", "targetCharacterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_targetPlaceId_fkey" FOREIGN KEY ("projectId", "targetPlaceId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_targetFactionId_fkey" FOREIGN KEY ("projectId", "targetFactionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_targetArtifactId_fkey" FOREIGN KEY ("projectId", "targetArtifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database invariants not expressible in Prisma schema syntax.
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_source_endpoint_check" CHECK (
  ("sourceKind" = 'CHARACTER' AND "sourceCharacterId" IS NOT NULL AND "sourcePlaceId" IS NULL AND "sourceFactionId" IS NULL AND "sourceArtifactId" IS NULL) OR
  ("sourceKind" = 'PLACE' AND "sourcePlaceId" IS NOT NULL AND "sourceCharacterId" IS NULL AND "sourceFactionId" IS NULL AND "sourceArtifactId" IS NULL) OR
  ("sourceKind" = 'FACTION' AND "sourceFactionId" IS NOT NULL AND "sourceCharacterId" IS NULL AND "sourcePlaceId" IS NULL AND "sourceArtifactId" IS NULL) OR
  ("sourceKind" = 'ARTIFACT' AND "sourceArtifactId" IS NOT NULL AND "sourceCharacterId" IS NULL AND "sourcePlaceId" IS NULL AND "sourceFactionId" IS NULL)
);
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_target_endpoint_check" CHECK (
  ("targetKind" = 'CHARACTER' AND "targetCharacterId" IS NOT NULL AND "targetPlaceId" IS NULL AND "targetFactionId" IS NULL AND "targetArtifactId" IS NULL) OR
  ("targetKind" = 'PLACE' AND "targetPlaceId" IS NOT NULL AND "targetCharacterId" IS NULL AND "targetFactionId" IS NULL AND "targetArtifactId" IS NULL) OR
  ("targetKind" = 'FACTION' AND "targetFactionId" IS NOT NULL AND "targetCharacterId" IS NULL AND "targetPlaceId" IS NULL AND "targetArtifactId" IS NULL) OR
  ("targetKind" = 'ARTIFACT' AND "targetArtifactId" IS NOT NULL AND "targetCharacterId" IS NULL AND "targetPlaceId" IS NULL AND "targetFactionId" IS NULL)
);
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_not_self_check" CHECK ("sourceKind" <> "targetKind" OR COALESCE("sourceCharacterId", "sourcePlaceId", "sourceFactionId", "sourceArtifactId") <> COALESCE("targetCharacterId", "targetPlaceId", "targetFactionId", "targetArtifactId"));
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_type_label_check" CHECK ("typeKey" ~ '^[A-Z][A-Z0-9_]{0,63}$' AND length(btrim("label")) BETWEEN 1 AND 100 AND length(COALESCE("description",'')) <= 10000);
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_symmetric_order_check" CHECK ("direction" <> 'SYMMETRIC' OR (("sourceKind"::text || ':' || COALESCE("sourceCharacterId", "sourcePlaceId", "sourceFactionId", "sourceArtifactId")) COLLATE "C") < (("targetKind"::text || ':' || COALESCE("targetCharacterId", "targetPlaceId", "targetFactionId", "targetArtifactId")) COLLATE "C"));
CREATE UNIQUE INDEX "Relationship_identity_key" ON "Relationship" ("projectId", "typeKey", "direction", "sourceKind", (COALESCE("sourceCharacterId", "sourcePlaceId", "sourceFactionId", "sourceArtifactId")), "targetKind", (COALESCE("targetCharacterId", "targetPlaceId", "targetFactionId", "targetArtifactId")));
