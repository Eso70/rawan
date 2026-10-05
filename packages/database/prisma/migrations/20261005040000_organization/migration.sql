-- CreateEnum
CREATE TYPE "TagResourceKind" AS ENUM ('NOTE', 'CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT', 'SCENE', 'TIMELINE_EVENT', 'PLOT_POINT');

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "resourceKind" "TagResourceKind" NOT NULL,
    "noteId" TEXT,
    "characterId" TEXT,
    "placeId" TEXT,
    "factionId" TEXT,
    "artifactId" TEXT,
    "sceneId" TEXT,
    "eventId" TEXT,
    "plotPointId" TEXT,
    "bookId" TEXT,
    "chapterId" TEXT,

    CONSTRAINT "TagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_projectId_updatedAt_id_idx" ON "Note"("projectId", "updatedAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "Note_projectId_id_key" ON "Note"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_projectId_id_key" ON "Tag"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_projectId_normalizedName_key" ON "Tag"("projectId", "normalizedName");

-- CreateIndex
CREATE INDEX "TagAssignment_tagId_resourceKind_id_idx" ON "TagAssignment"("tagId", "resourceKind", "id");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_noteId_tagId_idx" ON "TagAssignment"("projectId", "noteId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_characterId_tagId_idx" ON "TagAssignment"("projectId", "characterId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_placeId_tagId_idx" ON "TagAssignment"("projectId", "placeId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_factionId_tagId_idx" ON "TagAssignment"("projectId", "factionId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_artifactId_tagId_idx" ON "TagAssignment"("projectId", "artifactId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_sceneId_tagId_idx" ON "TagAssignment"("projectId", "sceneId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_eventId_tagId_idx" ON "TagAssignment"("projectId", "eventId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_plotPointId_tagId_idx" ON "TagAssignment"("projectId", "plotPointId", "tagId");

-- CreateIndex
CREATE INDEX "TagAssignment_projectId_bookId_idx" ON "TagAssignment"("projectId", "bookId");

-- CreateIndex
CREATE INDEX "TagAssignment_bookId_chapterId_idx" ON "TagAssignment"("bookId", "chapterId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_tagId_fkey" FOREIGN KEY ("projectId", "tagId") REFERENCES "Tag"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_noteId_fkey" FOREIGN KEY ("projectId", "noteId") REFERENCES "Note"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_characterId_fkey" FOREIGN KEY ("projectId", "characterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_placeId_fkey" FOREIGN KEY ("projectId", "placeId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_factionId_fkey" FOREIGN KEY ("projectId", "factionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_artifactId_fkey" FOREIGN KEY ("projectId", "artifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_bookId_fkey" FOREIGN KEY ("projectId", "bookId") REFERENCES "Book"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_bookId_chapterId_fkey" FOREIGN KEY ("bookId", "chapterId") REFERENCES "Chapter"("bookId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_chapterId_sceneId_fkey" FOREIGN KEY ("chapterId", "sceneId") REFERENCES "Scene"("chapterId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_eventId_fkey" FOREIGN KEY ("projectId", "eventId") REFERENCES "TimelineEvent"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_projectId_plotPointId_fkey" FOREIGN KEY ("projectId", "plotPointId") REFERENCES "PlotPoint"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostgreSQL is the single authority for case/whitespace tag identity.
CREATE FUNCTION normalize_rawan_tag() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW."name" := btrim(regexp_replace(NEW."name", U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+', ' ', 'g'));
  NEW."normalizedName" := lower(NEW."name");
  RETURN NEW;
END; $$;
CREATE TRIGGER "Tag_normalization" BEFORE INSERT OR UPDATE ON "Tag" FOR EACH ROW EXECUTE FUNCTION normalize_rawan_tag();
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_content_check" CHECK (length("name") BETWEEN 1 AND 100 AND "normalizedName" = lower(btrim(regexp_replace("name", U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+', ' ', 'g'))));
ALTER TABLE "Note" ADD CONSTRAINT "Note_content_check" CHECK (length("title") BETWEEN 1 AND 200 AND length(btrim(regexp_replace("title", U&'[\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+', ' ', 'g'))) > 0 AND length("content") <= 50000);
ALTER TABLE "TagAssignment" ADD CONSTRAINT "TagAssignment_kind_check" CHECK (
("resourceKind" = 'NOTE' AND "noteId" IS NOT NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'CHARACTER' AND "noteId" IS NULL AND "characterId" IS NOT NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'PLACE' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NOT NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'FACTION' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NOT NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'ARTIFACT' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NOT NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'SCENE' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NOT NULL AND "eventId" IS NULL AND "plotPointId" IS NULL AND "bookId" IS NOT NULL AND "chapterId" IS NOT NULL) OR
("resourceKind" = 'TIMELINE_EVENT' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NOT NULL AND "plotPointId" IS NULL AND "bookId" IS NULL AND "chapterId" IS NULL) OR
("resourceKind" = 'PLOT_POINT' AND "noteId" IS NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL AND "sceneId" IS NULL AND "eventId" IS NULL AND "plotPointId" IS NOT NULL AND "bookId" IS NULL AND "chapterId" IS NULL)
);
CREATE UNIQUE INDEX "TagAssignment_identity_key" ON "TagAssignment" ("tagId", "resourceKind", (COALESCE("noteId", "characterId", "placeId", "factionId", "artifactId", "sceneId", "eventId", "plotPointId")));
