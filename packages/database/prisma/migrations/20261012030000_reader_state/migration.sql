-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('WANT_TO_READ', 'READING', 'FINISHED', 'PAUSED', 'DID_NOT_FINISH');

-- CreateTable
CREATE TABLE "LibraryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workId" TEXT,
    "title" TEXT NOT NULL,
    "byline" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "curatorLabel" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "editorial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LibraryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMember" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workId" TEXT,
    "releaseId" TEXT,
    "sectionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "offset" INTEGER NOT NULL,
    "progression" DOUBLE PRECISION NOT NULL,
    "furthest" DOUBLE PRECISION NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReaderBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "offset" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReaderBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReaderAnnotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "quote" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReaderAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseSupplement" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ReleaseSupplement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryEntry_userId_addedAt_id_idx" ON "LibraryEntry"("userId", "addedAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryEntry_userId_workId_key" ON "LibraryEntry"("userId", "workId");

-- CreateIndex
CREATE INDEX "LibraryCollection_userId_id_idx" ON "LibraryCollection"("userId", "id");

-- CreateIndex
CREATE INDEX "LibraryCollection_public_editorial_id_idx" ON "LibraryCollection"("public", "editorial", "id");

-- CreateIndex
CREATE INDEX "CollectionMember_collectionId_position_id_idx" ON "CollectionMember"("collectionId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMember_collectionId_entryId_key" ON "CollectionMember"("collectionId", "entryId");

-- CreateIndex
CREATE INDEX "ReadingState_userId_updatedAt_id_idx" ON "ReadingState"("userId", "updatedAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingState_userId_workId_key" ON "ReadingState"("userId", "workId");

-- CreateIndex
CREATE INDEX "ReaderBookmark_userId_releaseId_createdAt_id_idx" ON "ReaderBookmark"("userId", "releaseId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ReaderAnnotation_userId_releaseId_createdAt_id_idx" ON "ReaderAnnotation"("userId", "releaseId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ReleaseSupplement_releaseId_position_id_idx" ON "ReleaseSupplement"("releaseId", "position", "id");

-- AddForeignKey
ALTER TABLE "LibraryEntry" ADD CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEntry" ADD CONSTRAINT "LibraryEntry_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCollection" ADD CONSTRAINT "LibraryCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "LibraryCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMember" ADD CONSTRAINT "CollectionMember_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LibraryEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingState" ADD CONSTRAINT "ReadingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingState" ADD CONSTRAINT "ReadingState_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingState" ADD CONSTRAINT "ReadingState_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderBookmark" ADD CONSTRAINT "ReaderBookmark_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderAnnotation" ADD CONSTRAINT "ReaderAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReaderAnnotation" ADD CONSTRAINT "ReaderAnnotation_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseSupplement" ADD CONSTRAINT "ReleaseSupplement_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "WorkRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
