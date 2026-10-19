-- Additive rollout: keep legacy tutorial data and existing account access semantics.
-- Existing accounts require only the new eligibility declaration; signup creates required setup.
ALTER TABLE "UserOnboarding"
 ADD COLUMN "setupVersion" INTEGER NOT NULL DEFAULT 1,
 ADD COLUMN "setupStatus" TEXT NOT NULL DEFAULT 'not_started',
 ADD COLUMN "setupRequired" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "setupRevision" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "setupStep" TEXT NOT NULL DEFAULT 'welcome',
 ADD COLUMN "preferredName" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "purpose" TEXT,
 ADD COLUMN "creativeInterests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "readingFormats" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "readingGenres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "readingTopics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
 ADD COLUMN "interfaceLanguage" TEXT NOT NULL DEFAULT 'en',
 ADD COLUMN "discoverySource" TEXT,
 ADD COLUMN "discoveryOther" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "preferredStart" TEXT,
 ADD COLUMN "ageConfirmedAt" TIMESTAMP(3),
 ADD COLUMN "agePolicyVersion" TEXT,
 ADD COLUMN "setupCompletedAt" TIMESTAMP(3);
ALTER TABLE "UserOnboarding"
 ADD CONSTRAINT "setup_status_valid" CHECK ("setupStatus" IN ('not_started','in_progress','completed')),
 ADD CONSTRAINT "setup_purpose_valid" CHECK ("purpose" IS NULL OR "purpose" IN ('create','read','both')),
 ADD CONSTRAINT "setup_start_valid" CHECK ("preferredStart" IS NULL OR "preferredStart" IN ('studio','reader')),
 ADD CONSTRAINT "setup_age_pair" CHECK (("ageConfirmedAt" IS NULL) = ("agePolicyVersion" IS NULL)),
 ADD CONSTRAINT "setup_completion_valid" CHECK ("setupStatus" <> 'completed' OR ("ageConfirmedAt" IS NOT NULL AND "setupCompletedAt" IS NOT NULL AND (NOT "setupRequired" OR "purpose" IS NOT NULL)));
