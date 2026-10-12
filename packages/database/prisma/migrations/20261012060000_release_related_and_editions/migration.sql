-- AlterTable
ALTER TABLE "Work" ADD COLUMN     "nextReleaseVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "WorkEdition" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'WEB';

-- AlterTable
ALTER TABLE "ReleaseSection" ADD COLUMN     "groupTitle" TEXT;

-- AlterTable
ALTER TABLE "ResearchSource" ADD COLUMN     "mediaId" TEXT;

-- CreateTable
CREATE TABLE "ReleaseRelatedWork" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "targetWorkId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "ReleaseRelatedWork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseRelatedWork_releaseId_targetWorkId_kind_key" ON "ReleaseRelatedWork"("releaseId", "targetWorkId", "kind");

-- CreateIndex
CREATE INDEX "ResearchSource_mediaId_idx" ON "ResearchSource"("mediaId");

-- AddForeignKey
ALTER TABLE "ReleaseRelatedWork" ADD CONSTRAINT "ReleaseRelatedWork_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Preserve monotonic release numbering when migrating existing release records.
UPDATE "Work" AS w SET "nextReleaseVersion" = COALESCE((SELECT MAX(r.version) + 1 FROM "WorkRelease" AS r WHERE r."workId" = w.id), 1);
