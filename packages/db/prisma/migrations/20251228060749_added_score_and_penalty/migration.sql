/*
  Warnings:

  - The values [NOTSTARTED] on the enum `ContestStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `passingTestCases` on the `ChallengeResult` table. All the data in the column will be lost.
  - You are about to drop the column `totalPassingTestCases` on the `ContestResult` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContestStatus_new" AS ENUM ('RUNNING', 'ENDED');
ALTER TABLE "ContestResult" ALTER COLUMN "status" TYPE "ContestStatus_new" USING ("status"::text::"ContestStatus_new");
ALTER TYPE "ContestStatus" RENAME TO "ContestStatus_old";
ALTER TYPE "ContestStatus_new" RENAME TO "ContestStatus";
DROP TYPE "ContestStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChallengeResult" DROP COLUMN "passingTestCases",
ADD COLUMN     "penalty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ContestResult" DROP COLUMN "totalPassingTestCases",
ADD COLUMN     "penalty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;
