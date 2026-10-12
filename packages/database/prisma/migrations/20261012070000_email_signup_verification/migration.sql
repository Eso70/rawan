-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailSignupVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "codeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "sendWindowStartedAt" TIMESTAMP(3) NOT NULL,
    "lastSentAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "deliveryToken" TEXT,
    "deliveryUntil" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSignupVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDeliveryBudget" (
    "day" DATE NOT NULL,
    "sendCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailDeliveryBudget_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSignupVerification_email_key" ON "EmailSignupVerification"("email");

-- CreateIndex
CREATE INDEX "EmailSignupVerification_updatedAt_idx" ON "EmailSignupVerification"("updatedAt");

-- CreateIndex
CREATE INDEX "EmailSignupVerification_expiresAt_idx" ON "EmailSignupVerification"("expiresAt");

ALTER TABLE "EmailSignupVerification" ADD CONSTRAINT "email_signup_bounds" CHECK (
  char_length(email) BETWEEN 3 AND 254 AND email = lower(email) AND char_length(name) BETWEEN 1 AND 100
  AND attempts BETWEEN 0 AND 5 AND "sendCount" BETWEEN 0 AND 5
  AND ("codeHash" IS NULL OR "codeHash" ~ '^[a-f0-9]{64}$')
  AND ("passwordHash" IS NULL OR char_length("passwordHash") <= 255)
);
ALTER TABLE "EmailDeliveryBudget" ADD CONSTRAINT "email_delivery_bounds" CHECK ("sendCount" BETWEEN 0 AND 200);
