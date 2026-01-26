/*
  Warnings:

  - Added the required column `userId` to the `Complex` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Complex" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Complex" ADD CONSTRAINT "Complex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
