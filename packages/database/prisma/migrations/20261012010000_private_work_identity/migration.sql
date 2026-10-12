CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkSource" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Work_ownerUserId_createdAt_id_idx" ON "Work"("ownerUserId", "createdAt" DESC, "id");
CREATE UNIQUE INDEX "WorkSource_workId_bookId_key" ON "WorkSource"("workId", "bookId");
CREATE INDEX "WorkSource_projectId_bookId_idx" ON "WorkSource"("projectId", "bookId");
CREATE INDEX "WorkSource_workId_createdAt_id_idx" ON "WorkSource"("workId", "createdAt", "id");

ALTER TABLE "Work" ADD CONSTRAINT "Work_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkSource" ADD CONSTRAINT "WorkSource_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkSource" ADD CONSTRAINT "WorkSource_projectId_bookId_fkey" FOREIGN KEY ("projectId", "bookId") REFERENCES "Book"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
