/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Complex` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Complex_email_key" ON "Complex"("email");
