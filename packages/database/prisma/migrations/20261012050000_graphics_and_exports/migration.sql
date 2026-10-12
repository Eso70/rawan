-- AlterTable
ALTER TABLE "WorkMetadata" ADD COLUMN     "coverAssetId" TEXT;

-- AlterTable
ALTER TABLE "CreatorIdentity" ADD COLUMN     "avatarAssetId" TEXT;

-- AlterTable
ALTER TABLE "WorkRelease" ADD COLUMN     "coverAssetId" TEXT,
ADD COLUMN     "graphicLayout" TEXT,
ADD COLUMN     "readingDirection" TEXT;

-- AlterTable
ALTER TABLE "ReadingState" ADD COLUMN     "graphicOffset" DOUBLE PRECISION,
ADD COLUMN     "locatorKind" TEXT NOT NULL DEFAULT 'PROSE';

-- AlterTable
ALTER TABLE "ReleaseSupplement" ADD COLUMN     "data" JSONB;

-- CreateTable
CREATE TABLE "WorkAsset" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "status" "AiStatus" NOT NULL DEFAULT 'QUEUED',
    "originalReady" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactBlob" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "exportId" TEXT,
    "role" TEXT NOT NULL,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtifactBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseAsset" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "ReleaseAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicDocument" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ComicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicPage" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "spreadGroup" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ComicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicPanel" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "altText" TEXT NOT NULL,

    CONSTRAINT "ComicPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicScript" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speakerName" TEXT,

    CONSTRAINT "ComicScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComicAppearance" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "ComicAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseGraphicPage" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "logicalKey" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "spreadGroup" TEXT,
    "panels" JSONB NOT NULL,

    CONSTRAINT "ReleaseGraphicPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sourceReleaseId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "status" "AiStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkAsset_workId_createdAt_id_idx" ON "WorkAsset"("workId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "WorkAsset_status_leaseUntil_createdAt_idx" ON "WorkAsset"("status", "leaseUntil", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactBlob_storageKey_key" ON "ArtifactBlob"("storageKey");

-- CreateIndex
CREATE INDEX "ArtifactBlob_assetId_ready_role_idx" ON "ArtifactBlob"("assetId", "ready", "role");

-- CreateIndex
CREATE INDEX "ArtifactBlob_exportId_ready_idx" ON "ArtifactBlob"("exportId", "ready");

-- CreateIndex
CREATE INDEX "ArtifactBlob_assetId_exportId_createdAt_idx" ON "ArtifactBlob"("assetId", "exportId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseAsset_releaseId_assetId_key" ON "ReleaseAsset"("releaseId", "assetId");

-- CreateIndex
CREATE INDEX "ComicDocument_workId_id_idx" ON "ComicDocument"("workId", "id");

-- CreateIndex
CREATE INDEX "ComicPage_comicId_position_id_idx" ON "ComicPage"("comicId", "position", "id");

-- CreateIndex
CREATE INDEX "ComicPanel_pageId_position_id_idx" ON "ComicPanel"("pageId", "position", "id");

-- CreateIndex
CREATE INDEX "ComicScript_pageId_position_id_idx" ON "ComicScript"("pageId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ComicAppearance_pageId_kind_entityId_key" ON "ComicAppearance"("pageId", "kind", "entityId");

-- CreateIndex
CREATE INDEX "ReleaseGraphicPage_releaseId_position_id_idx" ON "ReleaseGraphicPage"("releaseId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseGraphicPage_releaseId_logicalKey_key" ON "ReleaseGraphicPage"("releaseId", "logicalKey");

-- CreateIndex
CREATE INDEX "ExportJob_workId_createdAt_id_idx" ON "ExportJob"("workId", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "ExportJob_status_leaseUntil_createdAt_idx" ON "ExportJob"("status", "leaseUntil", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkAsset" ADD CONSTRAINT "WorkAsset_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactBlob" ADD CONSTRAINT "ArtifactBlob_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "WorkAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactBlob" ADD CONSTRAINT "ArtifactBlob_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "ExportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseAsset" ADD CONSTRAINT "ReleaseAsset_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseAsset" ADD CONSTRAINT "ReleaseAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "WorkAsset"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "ComicDocument" ADD CONSTRAINT "ComicDocument_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicPage" ADD CONSTRAINT "ComicPage_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "ComicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicPage" ADD CONSTRAINT "ComicPage_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "WorkAsset"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "ComicPanel" ADD CONSTRAINT "ComicPanel_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicScript" ADD CONSTRAINT "ComicScript_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComicAppearance" ADD CONSTRAINT "ComicAppearance_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ComicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseGraphicPage" ADD CONSTRAINT "ReleaseGraphicPage_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
