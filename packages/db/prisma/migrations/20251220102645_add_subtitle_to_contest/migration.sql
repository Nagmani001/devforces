/*
  Warnings:

  - Added the required column `subtitle` to the `Contest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "subtitle" TEXT NOT NULL;
