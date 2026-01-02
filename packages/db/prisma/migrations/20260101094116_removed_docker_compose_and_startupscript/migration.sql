/*
  Warnings:

  - You are about to drop the column `dockerComposeFile` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `startupScript` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "dockerComposeFile",
DROP COLUMN "startupScript";
