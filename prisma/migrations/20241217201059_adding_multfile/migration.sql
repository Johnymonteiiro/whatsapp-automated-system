/*
  Warnings:

  - Added the required column `doc_link` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doc_name` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "doc_link" TEXT NOT NULL,
ADD COLUMN     "doc_name" TEXT NOT NULL;
