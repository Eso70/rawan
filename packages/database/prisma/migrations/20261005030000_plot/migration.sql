-- CreateEnum
CREATE TYPE "PlotPointStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotPoint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "PlotPointStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlotPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotPointScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,

    CONSTRAINT "PlotPointScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotPointEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "PlotPointEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlotPointEntity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "kind" "WorldEntityKind" NOT NULL,
    "role" TEXT,
    "characterId" TEXT,
    "placeId" TEXT,
    "factionId" TEXT,
    "artifactId" TEXT,

    CONSTRAINT "PlotPointEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plot_projectId_position_id_idx" ON "Plot"("projectId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_projectId_id_key" ON "Plot"("projectId", "id");

-- CreateIndex
CREATE INDEX "PlotPoint_plotId_position_id_idx" ON "PlotPoint"("plotId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PlotPoint_projectId_id_key" ON "PlotPoint"("projectId", "id");

-- CreateIndex
CREATE INDEX "PlotPointScene_sceneId_pointId_idx" ON "PlotPointScene"("sceneId", "pointId");

-- CreateIndex
CREATE INDEX "PlotPointScene_projectId_bookId_idx" ON "PlotPointScene"("projectId", "bookId");

-- CreateIndex
CREATE INDEX "PlotPointScene_bookId_chapterId_idx" ON "PlotPointScene"("bookId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "PlotPointScene_pointId_sceneId_key" ON "PlotPointScene"("pointId", "sceneId");

-- CreateIndex
CREATE INDEX "PlotPointEvent_eventId_pointId_idx" ON "PlotPointEvent"("eventId", "pointId");

-- CreateIndex
CREATE UNIQUE INDEX "PlotPointEvent_pointId_eventId_key" ON "PlotPointEvent"("pointId", "eventId");

-- CreateIndex
CREATE INDEX "PlotPointEntity_pointId_id_idx" ON "PlotPointEntity"("pointId", "id");

-- CreateIndex
CREATE INDEX "PlotPointEntity_projectId_characterId_pointId_idx" ON "PlotPointEntity"("projectId", "characterId", "pointId");

-- CreateIndex
CREATE INDEX "PlotPointEntity_projectId_placeId_pointId_idx" ON "PlotPointEntity"("projectId", "placeId", "pointId");

-- CreateIndex
CREATE INDEX "PlotPointEntity_projectId_factionId_pointId_idx" ON "PlotPointEntity"("projectId", "factionId", "pointId");

-- CreateIndex
CREATE INDEX "PlotPointEntity_projectId_artifactId_pointId_idx" ON "PlotPointEntity"("projectId", "artifactId", "pointId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_projectId_id_key" ON "Book"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_bookId_id_key" ON "Chapter"("bookId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_chapterId_id_key" ON "Scene"("chapterId", "id");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPoint" ADD CONSTRAINT "PlotPoint_projectId_plotId_fkey" FOREIGN KEY ("projectId", "plotId") REFERENCES "Plot"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointScene" ADD CONSTRAINT "PlotPointScene_projectId_pointId_fkey" FOREIGN KEY ("projectId", "pointId") REFERENCES "PlotPoint"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointScene" ADD CONSTRAINT "PlotPointScene_projectId_bookId_fkey" FOREIGN KEY ("projectId", "bookId") REFERENCES "Book"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointScene" ADD CONSTRAINT "PlotPointScene_bookId_chapterId_fkey" FOREIGN KEY ("bookId", "chapterId") REFERENCES "Chapter"("bookId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointScene" ADD CONSTRAINT "PlotPointScene_chapterId_sceneId_fkey" FOREIGN KEY ("chapterId", "sceneId") REFERENCES "Scene"("chapterId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEvent" ADD CONSTRAINT "PlotPointEvent_projectId_pointId_fkey" FOREIGN KEY ("projectId", "pointId") REFERENCES "PlotPoint"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEvent" ADD CONSTRAINT "PlotPointEvent_projectId_eventId_fkey" FOREIGN KEY ("projectId", "eventId") REFERENCES "TimelineEvent"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_projectId_pointId_fkey" FOREIGN KEY ("projectId", "pointId") REFERENCES "PlotPoint"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_projectId_characterId_fkey" FOREIGN KEY ("projectId", "characterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_projectId_placeId_fkey" FOREIGN KEY ("projectId", "placeId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_projectId_factionId_fkey" FOREIGN KEY ("projectId", "factionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_projectId_artifactId_fkey" FOREIGN KEY ("projectId", "artifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain integrity beyond Prisma's schema language.
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_content_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200 AND length(COALESCE("description",'')) <= 10000 AND ("category" IS NULL OR length(btrim("category")) BETWEEN 1 AND 100) AND "position" >= 0);
ALTER TABLE "PlotPoint" ADD CONSTRAINT "PlotPoint_content_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200 AND length(COALESCE("description",'')) <= 10000 AND "position" >= 0);
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_role_check" CHECK ("role" IS NULL OR length(btrim("role")) BETWEEN 1 AND 100);
ALTER TABLE "PlotPointEntity" ADD CONSTRAINT "PlotPointEntity_kind_check" CHECK (
 ("kind" = 'CHARACTER' AND "characterId" IS NOT NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'PLACE' AND "placeId" IS NOT NULL AND "characterId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'FACTION' AND "factionId" IS NOT NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'ARTIFACT' AND "artifactId" IS NOT NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL)
);
CREATE UNIQUE INDEX "PlotPointEntity_identity_key" ON "PlotPointEntity" ("pointId", "kind", (COALESCE("characterId", "placeId", "factionId", "artifactId")));
