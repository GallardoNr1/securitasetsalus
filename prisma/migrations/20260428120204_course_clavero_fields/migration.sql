/*
  Warnings:

  - You are about to drop the column `eligibleForClaveroProfessionalCert` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "eligibleForClaveroProfessionalCert",
ADD COLUMN     "claveroSkillCode" TEXT,
ADD COLUMN     "claveroSkillSuffix" TEXT,
ADD COLUMN     "includedKit" TEXT,
ADD COLUMN     "prerequisiteSkillCodes" TEXT[];
