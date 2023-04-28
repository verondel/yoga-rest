/*
  Warnings:

  - The `cmplx` column on the `lesson` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "lesson" DROP COLUMN "cmplx",
ADD COLUMN     "cmplx" INTEGER;
