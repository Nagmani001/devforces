/*
  Warnings:

  - Added the required column `otp` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `otpExpiry` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" TEXT NOT NULL,
ADD COLUMN     "otpExpiry" TIMESTAMP(3) NOT NULL;
