/*
  Warnings:

  - Added the required column `is_visible` to the `tp_lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `src_image` to the `tp_lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tp_lesson" ADD COLUMN     "is_visible" BOOLEAN NOT NULL,
ADD COLUMN     "src_image" VARCHAR(100) NOT NULL;
