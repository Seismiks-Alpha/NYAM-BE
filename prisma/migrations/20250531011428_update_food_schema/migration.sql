/*
  Warnings:

  - You are about to drop the column `name` on the `Food` table. All the data in the column will be lost.
  - You are about to alter the column `calories` on the `Food` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `foodType` to the `Food` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portionSize` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Food_name_key";

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "name",
ADD COLUMN     "foodType" TEXT NOT NULL,
ADD COLUMN     "portionSize" INTEGER NOT NULL,
ALTER COLUMN "calories" SET DATA TYPE INTEGER;
