import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatMs, totalPoints } from "@/lib/scoring";

const LEAGUE_LABELS: Record<LeagueType, string> = {
  [LeagueType.JUNIORS]: "Juniors",
  [LeagueType.ADULT_AMATEUR]: "Adults - Amateur",
  [LeagueType.ADULT_PRO]: "Adults - Pro",
};

const DAY_LABELS: Record<RaceDay, string> = {
  [RaceDay.TUESDAY]: "Tuesday",
  [RaceDay.WEDNESDAY]: "Wednesday",
  [RaceDay.THURSDAY]: "Thursday",
};

function getLeagueType(value?: string): LeagueType {
  if (!value) {
    return LeagueType.ADULT_AMATEUR;
  }

  return Object.values(LeagueType).includes(value as LeagueType)
    ? (value as LeagueType)
    : LeagueType.ADULT_AMATEUR;
}

function getRaceDay(value?: string): RaceDay {
  if (!value) {
    return RaceDay.TUESDAY;
  }

  return Object.values(RaceDay).includes(value as RaceDay)
    ? (value as RaceDay)
    : RaceDay.TUESDAY;
}

export default async function RoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { roundId } = await params;
  const resolved = (await searchParams) ?? {};
  const selectedLeague = getLeagueType(Array.isArray(resolved.league) ? resolved.league[0] : resolved.league);
  const selectedDay = getRaceDay(Array.isArray(resolved.day) ? resolved.day[0] : resolved.day);

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      season: {
        include: {
          year: true,
        },
      },
      results: {
        where: {
          leagueType: selectedLeague,
          raceDay: selectedDay,
        },
        include: { driver: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!round) {
    notFound();
  }

  return (
    <main className="container">
      <section className="card stack-sm">
        <p className="eyebrow">
          {round.season.year.label} - {round.season.name}
        </p>
        <h1>Round {round.roundNumber} Results</h1>
        <p className="muted">{round.weekStarting ? round.weekStarting.toDateString() : "No week start date provided"}</p>
        <p>{round.notes ?? "No notes"}</p>
        <p className="small muted">
          {LEAGUE_LABELS[selectedLeague]} - {DAY_LABELS[selectedDay]}
        </p>

        <div className="split-links">
          <Link className="small-button" href={`/rounds/${round.id}/edit?league=${selectedLeague}&day=${selectedDay}`}>
            Edit Round
          </Link>
          <Link className="small-button" href="/">
            Back to Dashboard
          </Link>
        </div>
      </section>

      <section className="card stack-sm">
        <h2>Filtered Results</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Driver</th>
                <th>Base Pts</th>
                <th>Flat Times</th>
                <th>Best Lap Bonus</th>
                <th>Total Pts</th>
                <th>Fastest Lap</th>
              </tr>
            </thead>
            <tbody>
              {round.results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No results entered for this league/day.
                  </td>
                </tr>
              ) : (
                round.results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.position}</td>
                    <td>{result.driver.name}</td>
                    <td>{result.pointsEarned}</td>
                    <td>{result.flatTimes}</td>
                    <td>{result.bestLapBonus ? "+1" : "-"}</td>
                    <td className="strong">{totalPoints(result.pointsEarned, result.flatTimes, result.bestLapBonus)}</td>
                    <td>{formatMs(result.fastestLapMs)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
