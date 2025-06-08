-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginDate" TIMESTAMP(3),
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;
