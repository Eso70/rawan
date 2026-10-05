CREATE TYPE "AiTask" AS ENUM ('BRAINSTORM', 'SUMMARIZE', 'REWRITE');
CREATE TYPE "AiStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TABLE "AiGeneration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "requestedByUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "task" "AiTask" NOT NULL,
  "status" "AiStatus" NOT NULL DEFAULT 'QUEUED',
  "instructions" TEXT NOT NULL,
  "inputText" TEXT NOT NULL,
  "context" JSONB NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "result" JSONB,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "errorCode" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "leaseToken" TEXT,
  "leaseUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AiGeneration_input_bounds" CHECK (char_length("instructions") BETWEEN 1 AND 2000 AND char_length("inputText") <= 8000 AND jsonb_typeof("context") = 'array' AND jsonb_array_length("context") <= 8),
  CONSTRAINT "AiGeneration_usage_bounds" CHECK (("inputTokens" IS NULL OR "inputTokens" >= 0) AND ("outputTokens" IS NULL OR "outputTokens" >= 0) AND "attempts" BETWEEN 0 AND 3)
);
CREATE INDEX "AiGeneration_projectId_createdAt_id_idx" ON "AiGeneration"("projectId", "createdAt" DESC, "id");
CREATE INDEX "AiGeneration_requestedByUserId_createdAt_idx" ON "AiGeneration"("requestedByUserId", "createdAt");
CREATE INDEX "AiGeneration_status_leaseUntil_createdAt_idx" ON "AiGeneration"("status", "leaseUntil", "createdAt");
