import Image from "next/image";
import Link from "next/link";

import { deleteRound } from "@/app/actions";
import AddRoundDialog from "@/components/add-round-dialog";
import LeagueControlsPanel from "@/components/league-controls-panel";
import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { getDashboardData } from "@/lib/league";
import { formatMs, totalPoints } from "@/lib/scoring";

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

  const baseQuery = new URLSearchParams();

  if (data.selectedYear) {
    baseQuery.set("year", String(data.selectedYear.label));
  }

  if (data.selectedSeason) {
    baseQuery.set("season", data.selectedSeason.id);
  }

  baseQuery.set("league", data.selectedLeague);
  baseQuery.set("day", data.selectedDay);

  const roundHref = (roundId: string) => {
    const params = new URLSearchParams(baseQuery);
    params.set("round", roundId);
    return `/?${params.toString()}`;
  };

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
              <section className="card stack-sm">
                <div className="rounds-header">
                  <h2>Rounds</h2>
                  <AddRoundDialog seasonId={data.selectedSeason.id} />
                </div>

                <div className="round-grid">
                  {data.rounds.length === 0 ? (
                    <p className="muted">No rounds yet. Create one to start entering race results.</p>
                  ) : (
                    data.rounds.map((round) => (
                      <article className={`round-item${data.selectedRound?.id === round.id ? " is-selected" : ""}`} key={round.id}>
                        <Link className="round-card-link" href={roundHref(round.id)}>
                          <div>
                            <h3>Round {round.roundNumber}</h3>
                            <p className="small muted">{round.weekStarting ? round.weekStarting.toDateString() : "No date set"}</p>
                          </div>
                          <span className="small round-card-meta">
                            {round.results.length} result{round.results.length === 1 ? "" : "s"}
                          </span>
                        </Link>

                        <div className="split-links">
                          <Link className="small-button" href={`/rounds/${round.id}/edit?league=${data.selectedLeague}&day=${data.selectedDay}`}>
                            Edit
                          </Link>
                          <form action={deleteRound}>
                            <input type="hidden" name="roundId" value={round.id} />
                            <button type="submit" className="small-button danger-button">
                              Delete
                            </button>
                          </form>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              {data.selectedRound ? (
                <section className="card stack-sm">
                  <div className="actions-row">
                    <div>
                      <p className="eyebrow">Selected Round</p>
                      <h2>Round {data.selectedRound.roundNumber} Results</h2>
                      <p className="small muted">
                        {data.selectedRound.weekStarting ? data.selectedRound.weekStarting.toDateString() : "No week start date provided"}
                      </p>
                      <p className="small muted">
                        {LEAGUE_LABELS[data.selectedLeague]} - {DAY_LABELS[data.selectedDay]}
                      </p>
                    </div>
                    <Link className="small-button" href={`/rounds/${data.selectedRound.id}/edit?league=${data.selectedLeague}&day=${data.selectedDay}`}>
                      Edit Round
                    </Link>
                  </div>

                  {data.selectedRound.notes ? <p>{data.selectedRound.notes}</p> : null}

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
                        {data.selectedRound.results.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="muted">
                              No results entered for this league/day.
                            </td>
                          </tr>
                        ) : (
                          data.selectedRound.results.map((result) => (
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
              ) : null}

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
                          <th key={round.id}>
                            <Link href={roundHref(round.id)}>R{round.roundNumber}</Link>
                          </th>
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
                                    <span className="small">{cell.points} pts (P{cell.position})</span>
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