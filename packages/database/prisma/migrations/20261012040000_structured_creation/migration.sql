-- AlterTable
ALTER TABLE "ReleaseBlock" ADD COLUMN     "footnoteLabel" TEXT,
ADD COLUMN     "referenceLabel" TEXT;

-- CreateTable
CREATE TABLE "WorkDocument" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "DocumentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentBlock" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "footnoteLabel" TEXT,
    "referenceLabel" TEXT,

    CONSTRAINT "DocumentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "authors" TEXT[],
    "url" TEXT,
    "publisher" TEXT,
    "publicationDate" TEXT,
    "identifier" TEXT,
    "provenance" TEXT NOT NULL,

    CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCitation" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "documentBlockId" TEXT NOT NULL,
    "locator" TEXT NOT NULL,
    "quotation" TEXT NOT NULL,

    CONSTRAINT "ResearchCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "contextId" TEXT NOT NULL DEFAULT 'global',
    "values" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "modules" TEXT[],

    CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMap" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageMediaId" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapPin" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "entityKind" TEXT,
    "entityId" TEXT,

    CONSTRAINT "MapPin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapRegion" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "MapRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCanvas" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectCanvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasNode" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "referenceId" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CanvasNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasEdge" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CanvasEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkDocument_workId_id_idx" ON "WorkDocument"("workId", "id");

-- CreateIndex
CREATE INDEX "DocumentSection_documentId_position_id_idx" ON "DocumentSection"("documentId", "position", "id");

-- CreateIndex
CREATE INDEX "DocumentBlock_sectionId_position_id_idx" ON "DocumentBlock"("sectionId", "position", "id");

-- CreateIndex
CREATE INDEX "ResearchSource_projectId_id_idx" ON "ResearchSource"("projectId", "id");

-- CreateIndex
CREATE INDEX "ResearchCitation_sourceId_id_idx" ON "ResearchCitation"("sourceId", "id");

-- CreateIndex
CREATE INDEX "ResearchCitation_documentBlockId_id_idx" ON "ResearchCitation"("documentBlockId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_scope_contextId_key" ON "UserPreference"("userId", "scope", "contextId");

-- CreateIndex
CREATE INDEX "SavedView_userId_projectId_id_idx" ON "SavedView"("userId", "projectId", "id");

-- CreateIndex
CREATE INDEX "ProjectMap_projectId_id_idx" ON "ProjectMap"("projectId", "id");

-- CreateIndex
CREATE INDEX "MapPin_mapId_id_idx" ON "MapPin"("mapId", "id");

-- CreateIndex
CREATE INDEX "MapRegion_mapId_id_idx" ON "MapRegion"("mapId", "id");

-- CreateIndex
CREATE INDEX "ProjectCanvas_projectId_id_idx" ON "ProjectCanvas"("projectId", "id");

-- CreateIndex
CREATE INDEX "CanvasNode_canvasId_id_idx" ON "CanvasNode"("canvasId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasNode_canvasId_id_key" ON "CanvasNode"("canvasId", "id");

-- CreateIndex
CREATE INDEX "CanvasEdge_canvasId_id_idx" ON "CanvasEdge"("canvasId", "id");

-- AddForeignKey
ALTER TABLE "WorkDocument" ADD CONSTRAINT "WorkDocument_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentSection" ADD CONSTRAINT "DocumentSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "WorkDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBlock" ADD CONSTRAINT "DocumentBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "DocumentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchCitation" ADD CONSTRAINT "ResearchCitation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchCitation" ADD CONSTRAINT "ResearchCitation_documentBlockId_fkey" FOREIGN KEY ("documentBlockId") REFERENCES "DocumentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedView" ADD CONSTRAINT "SavedView_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMap" ADD CONSTRAINT "ProjectMap_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapPin" ADD CONSTRAINT "MapPin_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ProjectMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapRegion" ADD CONSTRAINT "MapRegion_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ProjectMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCanvas" ADD CONSTRAINT "ProjectCanvas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasNode" ADD CONSTRAINT "CanvasNode_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "ProjectCanvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_canvasId_sourceId_fkey" FOREIGN KEY ("canvasId", "sourceId") REFERENCES "CanvasNode"("canvasId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasEdge" ADD CONSTRAINT "CanvasEdge_canvasId_targetId_fkey" FOREIGN KEY ("canvasId", "targetId") REFERENCES "CanvasNode"("canvasId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
