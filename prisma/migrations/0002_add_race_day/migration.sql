-- CreateEnum
CREATE TYPE "RaceDay" AS ENUM ('TUESDAY', 'WEDNESDAY', 'THURSDAY');

-- AlterTable
ALTER TABLE "Result" ADD COLUMN "raceDay" "RaceDay" NOT NULL DEFAULT 'TUESDAY';

-- DropIndex
DROP INDEX "Result_roundId_driverId_leagueType_key";

-- DropIndex
DROP INDEX "Result_roundId_leagueType_idx";

-- CreateIndex
CREATE INDEX "Result_roundId_leagueType_raceDay_idx" ON "Result"("roundId", "leagueType", "raceDay");

-- CreateIndex
CREATE UNIQUE INDEX "Result_roundId_driverId_leagueType_raceDay_key" ON "Result"("roundId", "driverId", "leagueType", "raceDay");
