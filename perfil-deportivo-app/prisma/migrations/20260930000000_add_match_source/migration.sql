-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('MANUAL', 'LIVE');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "source" "MatchSource" NOT NULL DEFAULT 'MANUAL';
