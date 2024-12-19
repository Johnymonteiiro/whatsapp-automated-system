/*
  Warnings:

  - A unique constraint covering the columns `[doc_name]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "documents_doc_name_key" ON "documents"("doc_name");
