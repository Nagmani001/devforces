/*
  Warnings:

  - You are about to drop the column `penaltyFactor` on the `ChallengeResult` table. All the data in the column will be lost.
  - Added the required column `numberOfFailBefore1stAC` to the `ChallengeResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeOf1stAcSinceContestStart` to the `ChallengeResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChallengeResult" DROP COLUMN "penaltyFactor",
ADD COLUMN     "numberOfFailBefore1stAC" INTEGER NOT NULL,
ADD COLUMN     "timeOf1stAcSinceContestStart" INTEGER NOT NULL,
ALTER COLUMN "penalty" DROP DEFAULT,
ALTER COLUMN "score" DROP DEFAULT,
ALTER COLUMN "duration" DROP DEFAULT;
