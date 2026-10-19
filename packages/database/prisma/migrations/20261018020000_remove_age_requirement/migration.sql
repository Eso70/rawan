-- Remove the retired age prerequisite without deleting historical declarations or user data.
ALTER TABLE "UserOnboarding" DROP CONSTRAINT "setup_completion_valid";
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "setup_completion_valid"
 CHECK ("setupStatus" <> 'completed' OR ("setupCompletedAt" IS NOT NULL AND (NOT "setupRequired" OR "purpose" IS NOT NULL)));
