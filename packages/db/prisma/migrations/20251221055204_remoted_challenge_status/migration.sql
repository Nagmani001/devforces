/*
  Warnings:

  - The values [COMPLETED] on the enum `ChallengeStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChallengeStatus_new" AS ENUM ('NOTATTEMPTED', 'SUBMITTED', 'ATTEMPTED');
ALTER TABLE "ChallengeResult" ALTER COLUMN "challengeStatus" DROP DEFAULT;
ALTER TABLE "ChallengeResult" ALTER COLUMN "challengeStatus" TYPE "ChallengeStatus_new" USING ("challengeStatus"::text::"ChallengeStatus_new");
ALTER TYPE "ChallengeStatus" RENAME TO "ChallengeStatus_old";
ALTER TYPE "ChallengeStatus_new" RENAME TO "ChallengeStatus";
DROP TYPE "ChallengeStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChallengeResult" ALTER COLUMN "challengeStatus" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ContestResult" ALTER COLUMN "status" DROP DEFAULT;
