-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeagueType" AS ENUM ('JUNIORS', 'ADULT_AMATEUR', 'ADULT_PRO');

-- CreateTable
CREATE TABLE "LeagueYear" (
    "id" TEXT NOT NULL,
    "label" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "weekStarting" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "leagueType" "LeagueType" NOT NULL,
    "position" INTEGER NOT NULL,
    "fastestLapMs" INTEGER,
    "pointsEarned" INTEGER NOT NULL,
    "flatTimes" INTEGER NOT NULL DEFAULT 0,
    "bestLapBonus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueYear_label_key" ON "LeagueYear"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Season_yearId_number_key" ON "Season"("yearId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Round_seasonId_roundNumber_key" ON "Round"("seasonId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_name_key" ON "Driver"("name");

-- CreateIndex
CREATE INDEX "Result_roundId_leagueType_idx" ON "Result"("roundId", "leagueType");

-- CreateIndex
CREATE INDEX "Result_driverId_leagueType_idx" ON "Result"("driverId", "leagueType");

-- CreateIndex
CREATE UNIQUE INDEX "Result_roundId_driverId_leagueType_key" ON "Result"("roundId", "driverId", "leagueType");

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "LeagueYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

