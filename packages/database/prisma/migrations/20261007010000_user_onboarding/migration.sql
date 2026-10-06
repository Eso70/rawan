CREATE TABLE "UserOnboarding" (
  "userId" TEXT NOT NULL,
  "storyType" TEXT,
  "phase" TEXT NOT NULL DEFAULT 'choice',
  "step" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "draftName" TEXT NOT NULL DEFAULT 'The Mirewalker',
  "draftText" TEXT NOT NULL DEFAULT '',
  "draftImage" TEXT NOT NULL DEFAULT 'mirewalker',
  "draftRole" TEXT NOT NULL DEFAULT 'Wanderer',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
