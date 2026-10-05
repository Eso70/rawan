-- CreateEnum
CREATE TYPE "MediaResourceKind" AS ENUM ('PROJECT', 'NOTE', 'CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT');

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAttachment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "resourceKind" "MediaResourceKind" NOT NULL,
    "noteId" TEXT,
    "characterId" TEXT,
    "placeId" TEXT,
    "factionId" TEXT,
    "artifactId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'attachment',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCleanup" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaCleanup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE INDEX "Media_projectId_createdAt_id_idx" ON "Media"("projectId", "createdAt" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "Media_projectId_id_key" ON "Media"("projectId", "id");

-- CreateIndex
CREATE INDEX "MediaAttachment_mediaId_id_idx" ON "MediaAttachment"("mediaId", "id");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_resourceKind_id_idx" ON "MediaAttachment"("projectId", "resourceKind", "id");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_noteId_idx" ON "MediaAttachment"("projectId", "noteId");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_characterId_idx" ON "MediaAttachment"("projectId", "characterId");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_placeId_idx" ON "MediaAttachment"("projectId", "placeId");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_factionId_idx" ON "MediaAttachment"("projectId", "factionId");

-- CreateIndex
CREATE INDEX "MediaAttachment_projectId_artifactId_idx" ON "MediaAttachment"("projectId", "artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCleanup_storageKey_key" ON "MediaCleanup"("storageKey");

-- CreateIndex
CREATE INDEX "MediaCleanup_ownerUserId_projectId_id_idx" ON "MediaCleanup"("ownerUserId", "projectId", "id");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_mediaId_fkey" FOREIGN KEY ("projectId", "mediaId") REFERENCES "Media"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_noteId_fkey" FOREIGN KEY ("projectId", "noteId") REFERENCES "Note"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_characterId_fkey" FOREIGN KEY ("projectId", "characterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_placeId_fkey" FOREIGN KEY ("projectId", "placeId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_factionId_fkey" FOREIGN KEY ("projectId", "factionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_projectId_artifactId_fkey" FOREIGN KEY ("projectId", "artifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Media-specific guarantees that Prisma cannot express.
ALTER TABLE "Media" ADD CONSTRAINT "Media_metadata_check" CHECK (
 length("originalFilename") BETWEEN 1 AND 180 AND "originalFilename" !~ '[[:cntrl:]/\\]' AND
 "mimeType" IN ('image/jpeg','image/png','image/webp','application/pdf','text/plain') AND
 "sizeBytes" BETWEEN 1 AND 104857600 AND "sha256" ~ '^[a-f0-9]{64}$' AND
 "storageKey" ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
);
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_role_check" CHECK ("role" ~ '^[a-z][a-z0-9_-]{0,49}$');
ALTER TABLE "MediaAttachment" ADD CONSTRAINT "MediaAttachment_kind_check" CHECK (
 ("resourceKind"='PROJECT' AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=0) OR
 ("resourceKind"='NOTE' AND "noteId" IS NOT NULL AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=1) OR
 ("resourceKind"='CHARACTER' AND "characterId" IS NOT NULL AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=1) OR
 ("resourceKind"='PLACE' AND "placeId" IS NOT NULL AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=1) OR
 ("resourceKind"='FACTION' AND "factionId" IS NOT NULL AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=1) OR
 ("resourceKind"='ARTIFACT' AND "artifactId" IS NOT NULL AND num_nonnulls("noteId","characterId","placeId","factionId","artifactId")=1)
);
CREATE UNIQUE INDEX "MediaAttachment_identity_key" ON "MediaAttachment"("mediaId","resourceKind",(COALESCE("noteId","characterId","placeId","factionId","artifactId","projectId")));
-- Cleanup survives all cascades, including direct SQL deletion and process crashes.
CREATE FUNCTION enqueue_rawan_media_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO "MediaCleanup" (id,"projectId","ownerUserId","storageProvider","storageKey","createdAt")
 VALUES (OLD.id,OLD."projectId",OLD."uploadedByUserId",OLD."storageProvider",OLD."storageKey",now())
 ON CONFLICT(id) DO UPDATE SET "storageKey"=EXCLUDED."storageKey","storageProvider"=EXCLUDED."storageProvider";
 RETURN OLD;
END; $$;
CREATE TRIGGER "Media_cleanup" BEFORE DELETE ON "Media" FOR EACH ROW EXECUTE FUNCTION enqueue_rawan_media_cleanup();
