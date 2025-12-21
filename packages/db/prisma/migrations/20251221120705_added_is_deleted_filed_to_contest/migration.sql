-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
