/*
  Warnings:

  - You are about to drop the column `foodId` on the `FoodHistory` table. All the data in the column will be lost.
  - You are about to drop the `Food` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `calories` to the `FoodHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbohydrates` to the `FoodHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fat` to the `FoodHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodType` to the `FoodHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protein` to the `FoodHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodHistory" DROP CONSTRAINT "FoodHistory_foodId_fkey";

-- AlterTable
ALTER TABLE "FoodHistory" DROP COLUMN "foodId",
ADD COLUMN     "calories" INTEGER NOT NULL,
ADD COLUMN     "carbohydrates" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "foodType" TEXT NOT NULL,
ADD COLUMN     "protein" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Food";
