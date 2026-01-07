/*
  Warnings:

  - You are about to drop the column `engineExecutionScript` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `withDocker` on the `Challenge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" DROP COLUMN "engineExecutionScript",
DROP COLUMN "withDocker";
