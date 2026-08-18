-- CreateEnum
CREATE TYPE "ProfileSubjectType" AS ENUM ('SELF', 'DEPENDENT');

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "guardianConsentAt" TIMESTAMP(3),
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianRelationship" TEXT,
ADD COLUMN     "subjectType" "ProfileSubjectType" NOT NULL DEFAULT 'SELF';
