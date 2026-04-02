"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { parseLapToMs } from "@/lib/scoring";

function parseInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

async function refreshBestLapBonus(roundId: string, leagueType: LeagueType, raceDay: RaceDay) {
  await prisma.result.updateMany({
    where: { roundId, leagueType, raceDay },
    data: { bestLapBonus: false },
  });

  const fastest = await prisma.result.findFirst({
    where: {
      roundId,
      leagueType,
      raceDay,
      fastestLapMs: { not: null },
    },
    orderBy: { fastestLapMs: "asc" },
    select: { fastestLapMs: true },
  });

  if (fastest?.fastestLapMs === null || fastest?.fastestLapMs === undefined) {
    return;
  }

  await prisma.result.updateMany({
    where: {
      roundId,
      leagueType,
      raceDay,
      fastestLapMs: fastest.fastestLapMs,
    },
    data: { bestLapBonus: true },
  });
}

export async function createLeagueYear(formData: FormData) {
  const year = parseInteger(formData.get("year"));
  if (!year) {
    return;
  }

  const existing = await prisma.leagueYear.findUnique({
    where: { label: year },
  });

  if (!existing) {
    await prisma.leagueYear.create({
      data: {
        label: year,
      },
    });
  }

  revalidatePath("/");
}

export async function createSeason(formData: FormData) {
  const yearId = String(formData.get("yearId") ?? "");
  const seasonName = String(formData.get("seasonName") ?? "").trim();

  if (!yearId || !seasonName) {
    return;
  }

  const latestSeason = await prisma.season.findFirst({
    where: { yearId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const nextNumber = (latestSeason?.number ?? 0) + 1;

  await prisma.season.create({
    data: {
      yearId,
      number: nextNumber,
      name: seasonName,
    },
  });

  revalidatePath("/");
}

export async function createRound(formData: FormData) {
  const seasonId = String(formData.get("seasonId") ?? "");
  const roundNumber = parseInteger(formData.get("roundNumber"));
  const weekStarting = String(formData.get("weekStarting") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!seasonId || !roundNumber) {
    return;
  }

  const existing = await prisma.round.findFirst({
    where: { seasonId, roundNumber },
    select: { id: true },
  });

  const round =
    existing ??
    (await prisma.round.create({
      data: {
        seasonId,
        roundNumber,
        weekStarting: weekStarting ? new Date(weekStarting) : null,
        notes: notes || null,
      },
      select: { id: true },
    }));

  revalidatePath("/");
  redirect(`/rounds/${round.id}/edit`);
}

export async function deleteRound(formData: FormData) {
  const roundId = String(formData.get("roundId") ?? "");
  if (!roundId) {
    return;
  }

  await prisma.round.delete({ where: { id: roundId } });
  revalidatePath("/");
}

export async function updateRoundMeta(formData: FormData) {
  const roundId = String(formData.get("roundId") ?? "");
  const roundNumber = parseInteger(formData.get("roundNumber"));
  const weekStarting = String(formData.get("weekStarting") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!roundId || !roundNumber) {
    return;
  }

  await prisma.round.update({
    where: { id: roundId },
    data: {
      roundNumber,
      weekStarting: weekStarting ? new Date(weekStarting) : null,
      notes: notes || null,
    },
  });

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/edit`);
  revalidatePath("/");
}

export async function saveRoundLeague(formData: FormData) {
  const roundId = String(formData.get("roundId") ?? "");
  const leagueType = String(formData.get("leagueType") ?? "") as LeagueType;
  const raceDay = String(formData.get("raceDay") ?? "") as RaceDay;

  if (
    !roundId ||
    !Object.values(LeagueType).includes(leagueType) ||
    !Object.values(RaceDay).includes(raceDay)
  ) {
    return;
  }

  const drivers = await prisma.driver.findMany({ orderBy: { name: "asc" } });

  for (const driver of drivers) {
    const enabled = formData.get(`entry_${driver.id}_enabled`) === "on";
    const position = parseInteger(formData.get(`entry_${driver.id}_position`));
    const pointsEarned = parseInteger(formData.get(`entry_${driver.id}_points`));
    const flatTimes = parseInteger(formData.get(`entry_${driver.id}_flat`)) ?? 0;
    const fastestLapRaw = String(formData.get(`entry_${driver.id}_lap`) ?? "").trim();
    const fastestLapMs = parseLapToMs(fastestLapRaw);

    const existing = await prisma.result.findUnique({
      where: {
        roundId_driverId_leagueType_raceDay: {
          roundId,
          driverId: driver.id,
          leagueType,
          raceDay,
        },
      },
      select: { id: true },
    });

    if (!enabled) {
      if (existing) {
        await prisma.result.delete({ where: { id: existing.id } });
      }
      continue;
    }

    if (!position || pointsEarned === null) {
      continue;
    }

    await prisma.result.upsert({
      where: {
        roundId_driverId_leagueType_raceDay: {
          roundId,
          driverId: driver.id,
          leagueType,
          raceDay,
        },
      },
      create: {
        roundId,
        driverId: driver.id,
        leagueType,
        raceDay,
        position,
        pointsEarned,
        flatTimes,
        fastestLapMs,
      },
      update: {
        position,
        pointsEarned,
        flatTimes,
        fastestLapMs,
      },
    });
  }

  for (let i = 0; i < 5; i += 1) {
    const enabled = formData.get(`new_${i}_enabled`) === "on";
    const name = String(formData.get(`new_${i}_name`) ?? "").trim();
    const position = parseInteger(formData.get(`new_${i}_position`));
    const pointsEarned = parseInteger(formData.get(`new_${i}_points`));
    const flatTimes = parseInteger(formData.get(`new_${i}_flat`)) ?? 0;
    const fastestLapRaw = String(formData.get(`new_${i}_lap`) ?? "").trim();
    const fastestLapMs = parseLapToMs(fastestLapRaw);

    if (!enabled || !name || !position || pointsEarned === null) {
      continue;
    }

    const driver = await prisma.driver.upsert({
      where: { name },
      update: { active: true },
      create: { name },
      select: { id: true },
    });

    await prisma.result.upsert({
      where: {
        roundId_driverId_leagueType_raceDay: {
          roundId,
          driverId: driver.id,
          leagueType,
          raceDay,
        },
      },
      create: {
        roundId,
        driverId: driver.id,
        leagueType,
        raceDay,
        position,
        pointsEarned,
        flatTimes,
        fastestLapMs,
      },
      update: {
        position,
        pointsEarned,
        flatTimes,
        fastestLapMs,
      },
    });
  }

  await refreshBestLapBonus(roundId, leagueType, raceDay);

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/edit`);
  revalidatePath("/");
}
