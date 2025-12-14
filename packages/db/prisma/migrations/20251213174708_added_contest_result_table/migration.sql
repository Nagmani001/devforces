/*
  Warnings:

  - You are about to drop the column `status` on the `Contest` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Challenges` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contestId]` on the table `ContestResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,contestId]` on the table `ContestResult` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contestId` to the `ContestResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPassingTestCases` to the `ContestResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ContestResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Challenges" DROP CONSTRAINT "Challenges_contestId_fkey";

-- DropForeignKey
ALTER TABLE "Challenges" DROP CONSTRAINT "Challenges_userId_fkey";

-- AlterTable
ALTER TABLE "Contest" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ContestResult" ADD COLUMN     "contestId" TEXT NOT NULL,
ADD COLUMN     "status" "ContestStatus" NOT NULL DEFAULT 'NOTSTARTED',
ADD COLUMN     "totalPassingTestCases" INTEGER NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- DropTable
DROP TABLE "Challenges";

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notionLink" TEXT NOT NULL,
    "testFile" TEXT NOT NULL,
    "dockerComposeFile" TEXT NOT NULL,
    "startupScript" TEXT NOT NULL,
    "totalTestCases" INTEGER NOT NULL,
    "contestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeResult" (
    "id" TEXT NOT NULL,
    "challengeStatus" "ChallengeStatus" NOT NULL DEFAULT 'NOTATTEMPTED',
    "passingTestCases" INTEGER NOT NULL,
    "contestResultId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChallengeResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeResult_challengeId_key" ON "ChallengeResult"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeResult_userId_contestResultId_key" ON "ChallengeResult"("userId", "contestResultId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestResult_contestId_key" ON "ContestResult"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestResult_userId_contestId_key" ON "ContestResult"("userId", "contestId");

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestResult" ADD CONSTRAINT "ContestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeResult" ADD CONSTRAINT "ChallengeResult_contestResultId_fkey" FOREIGN KEY ("contestResultId") REFERENCES "ContestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeResult" ADD CONSTRAINT "ChallengeResult_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeResult" ADD CONSTRAINT "ChallengeResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
