-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "customCalories" INTEGER,
ADD COLUMN     "recommendedCalories" INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "displayName" DROP DEFAULT;
