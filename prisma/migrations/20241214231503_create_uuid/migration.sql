/*
  Warnings:

  - The primary key for the `configuration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `configuration` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "configuration" DROP CONSTRAINT "configuration_pkey",
ALTER COLUMN "id" SET DEFAULT 'c867e880-f026-4083-aed3-40ea30bfd927';

-- CreateIndex
CREATE UNIQUE INDEX "configuration_id_key" ON "configuration"("id");
