import { LeagueType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { totalPoints } from "@/lib/scoring";

type SearchOptions = {
  year?: string;
  season?: string;
  league?: string;
};

type RoundCell = {
  points: number;
  position: number;
};

type StandingsRow = {
  driverId: string;
  name: string;
  total: number;
  perRound: Record<string, RoundCell>;
};

const LEAGUE_VALUES = new Set(Object.values(LeagueType));

export function getLeagueType(value?: string): LeagueType {
  if (!value) {
    return LeagueType.ADULT_AMATEUR;
  }

  return LEAGUE_VALUES.has(value as LeagueType)
    ? (value as LeagueType)
    : LeagueType.ADULT_AMATEUR;
}

export async function getDashboardData(search: SearchOptions) {
  try {
    const years = await prisma.leagueYear.findMany({
      orderBy: { label: "desc" },
      include: {
        seasons: {
          orderBy: { number: "asc" },
        },
      },
    });

    const selectedYear =
      years.find((year) => String(year.label) === search.year) ?? years[0] ?? null;

    const seasons = selectedYear?.seasons ?? [];

    const selectedSeason =
      seasons.find((season) => season.id === search.season) ?? seasons[0] ?? null;

    const selectedLeague = getLeagueType(search.league);

    if (!selectedSeason) {
      return {
        years,
        seasons,
        selectedYear,
        selectedSeason,
        selectedLeague,
        rounds: [],
        standings: [] as StandingsRow[],
        dbError: null as string | null,
      };
    }

    const rounds = await prisma.round.findMany({
      where: { seasonId: selectedSeason.id },
      orderBy: { roundNumber: "asc" },
      include: {
        results: {
          where: { leagueType: selectedLeague },
          include: { driver: true },
        },
      },
    });

    const byDriver = new Map<string, StandingsRow>();

    for (const round of rounds) {
      for (const result of round.results) {
        const current = byDriver.get(result.driverId) ?? {
          driverId: result.driverId,
          name: result.driver.name,
          total: 0,
          perRound: {},
        };

        const points = totalPoints(result.pointsEarned, result.flatTimes, result.bestLapBonus);
        current.total += points;
        current.perRound[round.id] = {
          points,
          position: result.position,
        };

        byDriver.set(result.driverId, current);
      }
    }

    const standings = Array.from(byDriver.values()).sort((a, b) => {
      if (b.total === a.total) {
        return a.name.localeCompare(b.name);
      }

      return b.total - a.total;
    });

    return {
      years,
      seasons,
      selectedYear,
      selectedSeason,
      selectedLeague,
      rounds,
      standings,
      dbError: null as string | null,
    };
  } catch {
    return {
      years: [],
      seasons: [],
      selectedYear: null,
      selectedSeason: null,
      selectedLeague: getLeagueType(search.league),
      rounds: [],
      standings: [] as StandingsRow[],
      dbError:
        "Database connection failed. Set DATABASE_URL in .env to your Neon Postgres connection string and restart npm run dev.",
    };
  }
}
