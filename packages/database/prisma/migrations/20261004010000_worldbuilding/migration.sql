CREATE TABLE "Character" (
 "id" TEXT NOT NULL,
 "projectId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "summary" TEXT,
 "description" TEXT,
 "role" TEXT,
 "status" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Character_projectId_name_idx" ON "Character"("projectId", "name");
ALTER TABLE "Character" ADD CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Place" (
 "id" TEXT NOT NULL,
 "projectId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "summary" TEXT,
 "description" TEXT,
 "type" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Place_projectId_name_idx" ON "Place"("projectId", "name");
ALTER TABLE "Place" ADD CONSTRAINT "Place_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Faction" (
 "id" TEXT NOT NULL,
 "projectId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "summary" TEXT,
 "description" TEXT,
 "type" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Faction_projectId_name_idx" ON "Faction"("projectId", "name");
ALTER TABLE "Faction" ADD CONSTRAINT "Faction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Artifact" (
 "id" TEXT NOT NULL,
 "projectId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "summary" TEXT,
 "description" TEXT,
 "type" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Artifact_projectId_name_idx" ON "Artifact"("projectId", "name");
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;


