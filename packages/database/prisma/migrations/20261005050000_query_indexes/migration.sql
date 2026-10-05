-- DropIndex
DROP INDEX "Project_authorId_idx";

-- DropIndex
DROP INDEX "Scene_chapterId_position_idx";

-- DropIndex
DROP INDEX "Character_projectId_name_idx";

-- DropIndex
DROP INDEX "Place_projectId_name_idx";

-- DropIndex
DROP INDEX "Faction_projectId_name_idx";

-- DropIndex
DROP INDEX "Artifact_projectId_name_idx";

-- DropIndex
DROP INDEX "Relationship_projectId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Project_authorId_createdAt_id_idx" ON "Project"("authorId", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Scene_chapterId_position_createdAt_id_idx" ON "Scene"("chapterId", "position", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Character_projectId_name_id_idx" ON "Character"("projectId", "name", "id");

-- CreateIndex
CREATE INDEX "Place_projectId_name_id_idx" ON "Place"("projectId", "name", "id");

-- CreateIndex
CREATE INDEX "Faction_projectId_name_id_idx" ON "Faction"("projectId", "name", "id");

-- CreateIndex
CREATE INDEX "Artifact_projectId_name_id_idx" ON "Artifact"("projectId", "name", "id");

-- CreateIndex
CREATE INDEX "Relationship_projectId_createdAt_id_idx" ON "Relationship"("projectId", "createdAt" DESC, "id");

