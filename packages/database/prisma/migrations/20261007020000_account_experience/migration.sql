ALTER TABLE "UserOnboarding"
  ADD COLUMN "experience" TEXT,
  ADD COLUMN "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "goal" TEXT;
