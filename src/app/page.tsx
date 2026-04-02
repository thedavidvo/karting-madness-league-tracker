import Image from "next/image";
import Link from "next/link";

import LeagueControlsPanel from "@/components/league-controls-panel";
import RoundsPanel from "@/components/rounds-panel";
import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { getDashboardData } from "@/lib/league";

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

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

export default async function Home({ searchParams }: HomeProps) {
  const resolved = (await searchParams) ?? {};
  const data = await getDashboardData({
    year: getValue(resolved.year),
    season: getValue(resolved.season),
    league: getValue(resolved.league),
    day: getValue(resolved.day),
    round: getValue(resolved.round),
  });

  return (
    <main className="container">
      {data.dbError ? (
        <section className="card error-card">
          <h2>Database Not Connected</h2>
          <p>{data.dbError}</p>
        </section>
      ) : null}

      <div className="dashboard-shell">
        <aside className="sidebar stack-sm">
          <section className="hero card">
            <Link href="/" className="hero-logo-link" aria-label="Go to dashboard">
              <Image src="/Karting-Madness.png" alt="Kart Madness" width={200} height={58} priority />
            </Link>
            <p className="eyebrow">Karting Madness League Tracker</p>
            <h1>Season Dashboard</h1>
          </section>

          <LeagueControlsPanel
            years={data.years.map((year) => ({ id: year.id, label: year.label }))}
            seasons={data.seasons.map((season) => ({ id: season.id, name: season.name }))}
            selectedYear={data.selectedYear ? String(data.selectedYear.label) : ""}
            selectedSeason={data.selectedSeason?.id ?? ""}
            selectedYearId={data.selectedYear?.id}
            selectedYearLabel={data.selectedYear ? String(data.selectedYear.label) : undefined}
            selectedLeague={data.selectedLeague}
            selectedDay={data.selectedDay}
            leagueOptions={Object.values(LeagueType).map((league) => ({ value: league, label: LEAGUE_LABELS[league] }))}
            dayOptions={Object.values(RaceDay).map((day) => ({ value: day, label: DAY_LABELS[day] }))}
          />
        </aside>

        <section className="dashboard-content stack-sm">
          {data.selectedSeason ? (
            <>
              <RoundsPanel
                seasonId={data.selectedSeason.id}
                rounds={data.rounds.map((round) => ({
                  id: round.id,
                  roundNumber: round.roundNumber,
                  weekStarting: round.weekStarting ? round.weekStarting.toISOString() : null,
                  notes: round.notes,
                  results: round.results.map((result) => ({
                    id: result.id,
                    position: result.position,
                    pointsEarned: result.pointsEarned,
                    flatTimes: result.flatTimes,
                    bestLapBonus: result.bestLapBonus,
                    fastestLapMs: result.fastestLapMs,
                    driverName: result.driver.name,
                  })),
                }))}
                initialRoundId={data.selectedRound?.id}
                selectedLeague={data.selectedLeague}
                selectedDay={data.selectedDay}
                selectedLeagueLabel={LEAGUE_LABELS[data.selectedLeague]}
                selectedDayLabel={DAY_LABELS[data.selectedDay]}
              />

              <section className="card stack-sm">
                <div className="actions-row">
                  <div>
                    <h2>
                      {data.selectedYear?.label} - {data.selectedSeason.name}
                    </h2>
                    <p className="small muted">Round-by-round points ladder for {LEAGUE_LABELS[data.selectedLeague]}.</p>
                  </div>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Driver</th>
                        {data.rounds.map((round) => (
                          <th key={round.id}>R{round.roundNumber}</th>
                        ))}
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.standings.length === 0 ? (
                        <tr>
                          <td colSpan={Math.max(3, data.rounds.length + 3)} className="muted">
                            No results yet in this season/league.
                          </td>
                        </tr>
                      ) : (
                        data.standings.map((row, index) => (
                          <tr key={row.driverId}>
                            <td>{index + 1}</td>
                            <td>{row.name}</td>
                            {data.rounds.map((round) => {
                              const cell = row.perRound[round.id];

                              return (
                                <td key={round.id}>
                                  {cell ? (
                                    <span className="small">{cell.points}</span>
                                  ) : (
                                    <span className="muted small">-</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="strong">{row.total}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <section className="card">
              <p>No seasons found. Create a year to begin tracking.</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}