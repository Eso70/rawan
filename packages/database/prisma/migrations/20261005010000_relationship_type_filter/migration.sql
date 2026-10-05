-- Supports exact relationship-type filtering within an owned project.
CREATE INDEX "Relationship_projectId_typeKey_createdAt_idx"
ON "Relationship"("projectId", "typeKey", "createdAt");
