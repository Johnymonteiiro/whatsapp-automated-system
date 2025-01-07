/*
  Warnings:

  - You are about to drop the `sessao` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `auth_data` on the `sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "auth_data",
ADD COLUMN     "auth_data" JSONB NOT NULL;

-- DropTable
DROP TABLE "sessao";
