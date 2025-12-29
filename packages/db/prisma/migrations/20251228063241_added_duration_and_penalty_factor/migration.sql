/*
  Warnings:

  - Added the required column `duration` to the `ChallengeResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penaltyFactor` to the `ChallengeResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChallengeResult" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "penaltyFactor" INTEGER NOT NULL;
