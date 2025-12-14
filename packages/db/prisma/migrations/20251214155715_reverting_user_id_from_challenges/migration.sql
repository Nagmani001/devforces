/*
  Warnings:

  - You are about to drop the column `userId` on the `Challenge` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Challenge" DROP CONSTRAINT "Challenge_userId_fkey";

-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "userId";
