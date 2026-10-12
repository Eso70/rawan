-- CreateEnum
CREATE TYPE "WorkMedium" AS ENUM ('PROSE', 'GRAPHIC');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CreditRole" AS ENUM ('AUTHOR', 'ILLUSTRATOR', 'TRANSLATOR', 'EDITOR', 'CONTRIBUTOR');

-- CreateTable
CREATE TABLE "WorkMetadata" (
    "workId" TEXT NOT NULL,
    "subtitle" TEXT,
    "synopsis" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'en',
    "medium" "WorkMedium" NOT NULL DEFAULT 'PROSE',
    "form" TEXT,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkMetadata_pkey" PRIMARY KEY ("workId")
);

-- CreateTable
CREATE TABLE "CreatorIdentity" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "biography" TEXT NOT NULL DEFAULT '',
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCredit" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "creatorId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "CreditRole" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEdition" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "publisher" TEXT,
    "publicationDate" TEXT,
    "isbn13" TEXT,
    "doi" TEXT,

    CONSTRAINT "WorkEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSeries" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "anthology" BOOLEAN NOT NULL DEFAULT false,
    "public" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesMember" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,

    CONSTRAINT "SeriesMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedWork" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "targetWorkId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "RelatedWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkRelease" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "synopsis" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "medium" "WorkMedium" NOT NULL,
    "form" TEXT,
    "genres" TEXT[],
    "topics" TEXT[],
    "warnings" TEXT[],
    "edition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "WorkRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseCredit" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "creatorId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "CreditRole" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ReleaseCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseSection" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "logicalKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ReleaseSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseBlock" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "logicalKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'PARAGRAPH',
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ReleaseBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorIdentity_handle_key" ON "CreatorIdentity"("handle");

-- CreateIndex
CREATE INDEX "CreatorIdentity_ownerUserId_id_idx" ON "CreatorIdentity"("ownerUserId", "id");

-- CreateIndex
CREATE INDEX "WorkCredit_workId_position_id_idx" ON "WorkCredit"("workId", "position", "id");

-- CreateIndex
CREATE INDEX "WorkEdition_workId_id_idx" ON "WorkEdition"("workId", "id");

-- CreateIndex
CREATE INDEX "WorkSeries_ownerUserId_id_idx" ON "WorkSeries"("ownerUserId", "id");

-- CreateIndex
CREATE INDEX "SeriesMember_seriesId_position_id_idx" ON "SeriesMember"("seriesId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesMember_seriesId_workId_key" ON "SeriesMember"("seriesId", "workId");

-- CreateIndex
CREATE UNIQUE INDEX "RelatedWork_workId_targetWorkId_kind_key" ON "RelatedWork"("workId", "targetWorkId", "kind");

-- CreateIndex
CREATE INDEX "WorkRelease_status_publishedAt_id_idx" ON "WorkRelease"("status", "publishedAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkRelease_workId_version_key" ON "WorkRelease"("workId", "version");

-- CreateIndex
CREATE INDEX "ReleaseCredit_releaseId_position_id_idx" ON "ReleaseCredit"("releaseId", "position", "id");

-- CreateIndex
CREATE INDEX "ReleaseSection_releaseId_position_id_idx" ON "ReleaseSection"("releaseId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseSection_releaseId_logicalKey_key" ON "ReleaseSection"("releaseId", "logicalKey");

-- CreateIndex
CREATE INDEX "ReleaseBlock_sectionId_position_id_idx" ON "ReleaseBlock"("sectionId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseBlock_sectionId_logicalKey_key" ON "ReleaseBlock"("sectionId", "logicalKey");

-- AddForeignKey
ALTER TABLE "WorkMetadata" ADD CONSTRAINT "WorkMetadata_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorIdentity" ADD CONSTRAINT "CreatorIdentity_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCredit" ADD CONSTRAINT "WorkCredit_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCredit" ADD CONSTRAINT "WorkCredit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEdition" ADD CONSTRAINT "WorkEdition_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSeries" ADD CONSTRAINT "WorkSeries_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesMember" ADD CONSTRAINT "SeriesMember_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "WorkSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesMember" ADD CONSTRAINT "SeriesMember_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedWork" ADD CONSTRAINT "RelatedWork_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedWork" ADD CONSTRAINT "RelatedWork_targetWorkId_fkey" FOREIGN KEY ("targetWorkId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkRelease" ADD CONSTRAINT "WorkRelease_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseCredit" ADD CONSTRAINT "ReleaseCredit_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseCredit" ADD CONSTRAINT "ReleaseCredit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseSection" ADD CONSTRAINT "ReleaseSection_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseBlock" ADD CONSTRAINT "ReleaseBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReleaseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
