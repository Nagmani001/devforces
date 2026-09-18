-- DropIndex
DROP INDEX IF EXISTS "ChallengeResult_challengeId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeResult_userId_challengeId_key" ON "ChallengeResult"("userId", "challengeId");
