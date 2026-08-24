-- AlterTable
ALTER TABLE "User" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
