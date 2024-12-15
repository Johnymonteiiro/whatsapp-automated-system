/*
  Warnings:

  - You are about to drop the column `gpt_template` on the `configuration` table. All the data in the column will be lost.
  - Added the required column `prompt_template` to the `configuration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "configuration" DROP COLUMN "gpt_template",
ADD COLUMN     "prompt_template" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ADD CONSTRAINT "configuration_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "configuration_id_key";
