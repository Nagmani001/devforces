/*
  Warnings:

  - You are about to drop the column `challengeStatus` on the `ChallengeResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChallengeResult" DROP COLUMN "challengeStatus";

-- DropEnum
DROP TYPE "ChallengeStatus";
