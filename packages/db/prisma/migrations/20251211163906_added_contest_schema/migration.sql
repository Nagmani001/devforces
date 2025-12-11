-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('RUNNING', 'ENDED', 'NOTSTARTED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('NOTATTEMPTED', 'COMPLETED', 'ATTEMPTED');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isAdmin" SET DEFAULT false;

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'NOTSTARTED',

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notionLink" TEXT NOT NULL,
    "testFile" TEXT NOT NULL,
    "dockerComposeFile" TEXT NOT NULL,
    "startupScript" TEXT NOT NULL,
    "totalTestCases" INTEGER NOT NULL,
    "passedTestCases" INTEGER,
    "challengeStatus" "ChallengeStatus" NOT NULL DEFAULT 'NOTATTEMPTED',
    "contestId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestResult" (
    "id" TEXT NOT NULL,

    CONSTRAINT "ContestResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenges" ADD CONSTRAINT "Challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
