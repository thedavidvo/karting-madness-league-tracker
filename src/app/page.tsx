import Link from "next/link";

import { createLeagueYear } from "@/app/actions";
import { LeagueType } from "@/generated/prisma/enums";
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

export default async function Home({ searchParams }: HomeProps) {
  const resolved = (await searchParams) ?? {};
  const data = await getDashboardData({
    year: getValue(resolved.year),
    season: getValue(resolved.season),
    league: getValue(resolved.league),
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
            <p className="eyebrow">Kart Madness League Tracker</p>
            <h1>Season Dashboard</h1>
            <p className="muted">
              Track every Tuesday, Wednesday and Thursday race across all rounds, with automatic best-lap bonus and flat-time bonus points.
            </p>
          </section>

          <section className="card stack-sm">
            <form action="/" method="get" className="stack-sm">
              <h2>View Standings</h2>
              <label>
                Year
                <select name="year" defaultValue={data.selectedYear ? String(data.selectedYear.label) : ""}>
                  {data.years.map((year) => (
                    <option value={year.label} key={year.id}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Season
                <select name="season" defaultValue={data.selectedSeason?.id ?? ""}>
                  {data.seasons.map((season) => (
                    <option value={season.id} key={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                League
                <select name="league" defaultValue={data.selectedLeague}>
                  {Object.values(LeagueType).map((league) => (
                    <option value={league} key={league}>
                      {LEAGUE_LABELS[league]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Switch</button>
            </form>
          </section>

          <section className="card stack-sm">
            <form action={createLeagueYear} className="stack-sm">
              <h2>Create Year</h2>
              <label>
                Year Label
                <input name="year" type="number" min={2020} max={2100} defaultValue={new Date().getFullYear()} required />
              </label>
              <button type="submit">Add Year + 4 Seasons</button>
              <p className="small muted">Each year is auto-created with Season 1 to Season 4.</p>
            </form>
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
                    <p className="small muted">Round-by-round points ladder for {LEAGUE_LABELS[data.selectedLeague]}.</p>
                  </div>
                  <Link
                    className="button-link"
                    href={`/rounds/new?seasonId=${data.selectedSeason.id}&league=${data.selectedLeague}`}
                  >
                    Add Round
                  </Link>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Driver</th>
                        {data.rounds.map((round) => (
                          <th key={round.id}>
                            <Link href={`/rounds/${round.id}`}>R{round.roundNumber}</Link>
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

              <section className="card stack-sm">
                <h2>Rounds</h2>
                <div className="round-grid">
                  {data.rounds.length === 0 ? (
                    <p className="muted">No rounds yet. Create one to start entering race results.</p>
                  ) : (
                    data.rounds.map((round) => (
                      <article className="round-item" key={round.id}>
                        <div>
                          <h3>Round {round.roundNumber}</h3>
                          <p className="small muted">{round.weekStarting ? round.weekStarting.toDateString() : "No date set"}</p>
                        </div>
                        <div className="split-links">
                          <Link href={`/rounds/${round.id}`}>View</Link>
                          <Link href={`/rounds/${round.id}/edit?league=${data.selectedLeague}`}>Edit</Link>
                        </div>
                      </article>
                    ))
                  )}
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
