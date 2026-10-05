-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Era" (
    "id" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "start" DECIMAL(30,6),
    "end" DECIMAL(30,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Era_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "timelineId" TEXT NOT NULL,
    "eraId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "start" DECIMAL(30,6) NOT NULL,
    "end" DECIMAL(30,6),
    "dateLabel" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventEntity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" "WorldEntityKind" NOT NULL,
    "role" TEXT,
    "characterId" TEXT,
    "placeId" TEXT,
    "factionId" TEXT,
    "artifactId" TEXT,

    CONSTRAINT "EventEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timeline_projectId_createdAt_id_idx" ON "Timeline"("projectId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_projectId_id_key" ON "Timeline"("projectId", "id");

-- CreateIndex
CREATE INDEX "Era_timelineId_position_id_idx" ON "Era"("timelineId", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Era_timelineId_id_key" ON "Era"("timelineId", "id");

-- CreateIndex
CREATE INDEX "TimelineEvent_timelineId_start_position_id_idx" ON "TimelineEvent"("timelineId", "start", "position", "id");

-- CreateIndex
CREATE INDEX "TimelineEvent_timelineId_eraId_start_position_id_idx" ON "TimelineEvent"("timelineId", "eraId", "start", "position", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_projectId_id_key" ON "TimelineEvent"("projectId", "id");

-- CreateIndex
CREATE INDEX "EventEntity_eventId_id_idx" ON "EventEntity"("eventId", "id");

-- CreateIndex
CREATE INDEX "EventEntity_projectId_characterId_eventId_idx" ON "EventEntity"("projectId", "characterId", "eventId");

-- CreateIndex
CREATE INDEX "EventEntity_projectId_placeId_eventId_idx" ON "EventEntity"("projectId", "placeId", "eventId");

-- CreateIndex
CREATE INDEX "EventEntity_projectId_factionId_eventId_idx" ON "EventEntity"("projectId", "factionId", "eventId");

-- CreateIndex
CREATE INDEX "EventEntity_projectId_artifactId_eventId_idx" ON "EventEntity"("projectId", "artifactId", "eventId");

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Era" ADD CONSTRAINT "Era_timelineId_fkey" FOREIGN KEY ("timelineId") REFERENCES "Timeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_projectId_timelineId_fkey" FOREIGN KEY ("projectId", "timelineId") REFERENCES "Timeline"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_timelineId_eraId_fkey" FOREIGN KEY ("timelineId", "eraId") REFERENCES "Era"("timelineId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_projectId_eventId_fkey" FOREIGN KEY ("projectId", "eventId") REFERENCES "TimelineEvent"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_projectId_characterId_fkey" FOREIGN KEY ("projectId", "characterId") REFERENCES "Character"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_projectId_placeId_fkey" FOREIGN KEY ("projectId", "placeId") REFERENCES "Place"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_projectId_factionId_fkey" FOREIGN KEY ("projectId", "factionId") REFERENCES "Faction"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_projectId_artifactId_fkey" FOREIGN KEY ("projectId", "artifactId") REFERENCES "Artifact"("projectId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Domain constraints not expressible by Prisma's schema language.
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_name_check" CHECK (length(btrim("name")) BETWEEN 1 AND 200 AND length(COALESCE("description",'')) <= 10000);
ALTER TABLE "Era" ADD CONSTRAINT "Era_content_check" CHECK (length(btrim("name")) BETWEEN 1 AND 200 AND length(COALESCE("description",'')) <= 10000 AND "position" >= 0);
ALTER TABLE "Era" ADD CONSTRAINT "Era_range_check" CHECK ("start" IS NULL OR "end" IS NULL OR "start" <= "end");
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_content_check" CHECK (length(btrim("title")) BETWEEN 1 AND 200 AND length(COALESCE("summary",'')) <= 1000 AND length(COALESCE("description",'')) <= 10000 AND length(COALESCE("dateLabel",'')) <= 200 AND "position" >= 0);
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_range_check" CHECK ("end" IS NULL OR "start" <= "end");
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_kind_check" CHECK (
 ("kind" = 'CHARACTER' AND "characterId" IS NOT NULL AND "placeId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'PLACE' AND "placeId" IS NOT NULL AND "characterId" IS NULL AND "factionId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'FACTION' AND "factionId" IS NOT NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "artifactId" IS NULL) OR
 ("kind" = 'ARTIFACT' AND "artifactId" IS NOT NULL AND "characterId" IS NULL AND "placeId" IS NULL AND "factionId" IS NULL)
);
ALTER TABLE "EventEntity" ADD CONSTRAINT "EventEntity_role_check" CHECK ("role" IS NULL OR length(btrim("role")) BETWEEN 1 AND 100);
CREATE UNIQUE INDEX "EventEntity_identity_key" ON "EventEntity" ("eventId", "kind", (COALESCE("characterId", "placeId", "factionId", "artifactId")));
-- PostgreSQL numeric NaN is sortable but has no fictional chronology meaning.
ALTER TABLE "Era" ADD CONSTRAINT "Era_finite_chronology" CHECK
  (("start" IS NULL OR "start" <> 'NaN'::numeric) AND ("end" IS NULL OR "end" <> 'NaN'::numeric));
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_finite_chronology" CHECK
  ("start" <> 'NaN'::numeric AND ("end" IS NULL OR "end" <> 'NaN'::numeric));
