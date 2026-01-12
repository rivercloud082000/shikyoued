/*
  Warnings:

  - The primary key for the `Allowlist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Allowlist` table. All the data in the column will be lost.
  - You are about to drop the column `docxUrl` on the `SessionDoc` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `SessionDoc` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SessionDoc` table. All the data in the column will be lost.
  - You are about to drop the `CurriculumDoc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Allowlist_email_key";

-- AlterTable
ALTER TABLE "Allowlist" DROP CONSTRAINT "Allowlist_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Allowlist_pkey" PRIMARY KEY ("email");

-- AlterTable
ALTER TABLE "SessionDoc" DROP COLUMN "docxUrl",
DROP COLUMN "pdfUrl",
DROP COLUMN "updatedAt",
ALTER COLUMN "version" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "CurriculumDoc";

-- DropTable
DROP TABLE "Template";
