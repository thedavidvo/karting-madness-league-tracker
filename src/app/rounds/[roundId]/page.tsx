import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatMs, totalPoints } from "@/lib/scoring";

const LEAGUE_LABELS: Record<LeagueType, string> = {
  [LeagueType.JUNIORS]: "Juniors",
  [LeagueType.ADULT_AMATEUR]: "Adults - Amateur",
  [LeagueType.ADULT_PRO]: "Adults - Pro",
};

export default async function RoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      season: {
        include: {
          year: true,
        },
      },
      results: {
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

        <div className="split-links">
          <Link href={`/rounds/${round.id}/edit`}>Edit Round</Link>
          <Link href="/">Back to Dashboard</Link>
        </div>
      </section>

      {Object.values(LeagueType).map((leagueType) => {
        const results = round.results.filter((result) => result.leagueType === leagueType);

        return (
          <section className="card stack-sm" key={leagueType}>
            <h2>{LEAGUE_LABELS[leagueType]}</h2>
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
                  {results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="muted">
                        No results entered.
                      </td>
                    </tr>
                  ) : (
                    results.map((result) => (
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
        );
      })}
    </main>
  );
}
