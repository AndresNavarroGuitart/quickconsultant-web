-- AlterTable
ALTER TABLE "AthleteClub" ADD COLUMN     "league" TEXT,
ADD COLUMN     "sport" TEXT NOT NULL DEFAULT 'Otro';
