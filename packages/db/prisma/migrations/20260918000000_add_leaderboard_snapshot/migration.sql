-- CreateTable
CREATE TABLE "ContestLeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestLeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContestLeaderboardSnapshot_contestId_key" ON "ContestLeaderboardSnapshot"("contestId");

-- AddForeignKey
ALTER TABLE "ContestLeaderboardSnapshot" ADD CONSTRAINT "ContestLeaderboardSnapshot_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
