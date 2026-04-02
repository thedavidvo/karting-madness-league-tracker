import Link from "next/link";

import LeagueFiltersForm from "@/components/league-filters-form";
import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { getDashboardData } from "@/lib/league";
import { formatMs, totalPoints } from "@/lib/scoring";

type StandingsPageProps = {
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

function buildRoundHref(
  base: {
    year?: string;
    season?: string;
    league?: string;
    day?: string;
  },
  roundId: string,
): string {
  const params = new URLSearchParams();

  if (base.year) {
    params.set("year", base.year);
  }
  if (base.season) {
    params.set("season", base.season);
  }
  if (base.league) {
    params.set("league", base.league);
  }
  if (base.day) {
    params.set("day", base.day);
  }

  params.set("round", roundId);

  return `/standings?${params.toString()}`;
}

export default async function StandingsPage({ searchParams }: StandingsPageProps) {
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
          <section className="hero card stack-sm">
            <p className="eyebrow">Karting Madness League Tracker</p>
            <h1>Public Standings</h1>
            <p className="small muted">View-only leaderboard and round results.</p>
          </section>

          <section className="card stack-sm">
            <h2>Filters</h2>
            <LeagueFiltersForm
              actionPath="/standings"
              years={data.years.map((year) => ({ id: year.id, label: year.label }))}
              seasons={data.seasons.map((season) => ({ id: season.id, name: season.name }))}
              selectedYear={data.selectedYear ? String(data.selectedYear.label) : ""}
              selectedSeason={data.selectedSeason?.id ?? ""}
              selectedLeague={data.selectedLeague}
              selectedDay={data.selectedDay}
              leagueOptions={Object.values(LeagueType).map((league) => ({ value: league, label: LEAGUE_LABELS[league] }))}
              dayOptions={Object.values(RaceDay).map((day) => ({ value: day, label: DAY_LABELS[day] }))}
            />
          </section>
        </aside>

        <section className="dashboard-content stack-sm">
          {data.selectedSeason ? (
            <>
              <section className="card stack-sm">
                <div className="actions-row">
                  <div>
                    <h2>
                      {data.selectedYear?.label} - {data.selectedSeason.name}
                    </h2>
                    <p className="small muted">
                      {LEAGUE_LABELS[data.selectedLeague]} - {DAY_LABELS[data.selectedDay]}
                    </p>
                  </div>
                </div>

                <div className="round-grid">
                  {data.rounds.length === 0 ? (
                    <p className="muted">No rounds with results for this league/day yet.</p>
                  ) : (
                    data.rounds.map((round) => {
                      const isSelected = data.selectedRound?.id === round.id;

                      return (
                        <Link
                          key={round.id}
                          href={buildRoundHref(
                            {
                              year: data.selectedYear ? String(data.selectedYear.label) : undefined,
                              season: data.selectedSeason?.id,
                              league: data.selectedLeague,
                              day: data.selectedDay,
                            },
                            round.id,
                          )}
                          className={`round-item${isSelected ? " is-selected" : ""}`}
                        >
                          <div className="round-card-link">
                            <h3>Round {round.roundNumber}</h3>
                            <p className="small muted">{round.weekStarting ? round.weekStarting.toDateString() : "No date set"}</p>
                            <span className="small round-card-meta">
                              {round.results.length} result{round.results.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="card stack-sm">
                <h2>Selected Round Results</h2>
                {data.selectedRound?.notes ? <p>{data.selectedRound.notes}</p> : null}

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
                      {!data.selectedRound || data.selectedRound.results.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="muted">
                            No results entered for this round.
                          </td>
                        </tr>
                      ) : (
                        data.selectedRound.results.map((result) => (
                          <tr key={result.id}>
                            <td>{result.position}</td>
                            <td>{result.driver.name}</td>
                            <td>{result.pointsEarned}</td>
                            <td>{result.flatTimes}</td>
                            <td>{result.bestLapBonus ? "✓" : "-"}</td>
                            <td className="strong">{totalPoints(result.pointsEarned, result.flatTimes, result.bestLapBonus)}</td>
                            <td>{formatMs(result.fastestLapMs)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card stack-sm">
                <h2>Full Standings</h2>
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
                                  {cell ? <span className="small">{cell.points}</span> : <span className="muted small">-</span>}
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
              <p>No seasons found yet.</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
