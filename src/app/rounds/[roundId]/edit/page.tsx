import Link from "next/link";
import { notFound } from "next/navigation";

import { saveRoundLeague, updateRoundMeta } from "@/app/actions";
import { LeagueType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatMs } from "@/lib/scoring";

const LEAGUE_LABELS: Record<LeagueType, string> = {
  [LeagueType.JUNIORS]: "Juniors",
  [LeagueType.ADULT_AMATEUR]: "Adults - Amateur",
  [LeagueType.ADULT_PRO]: "Adults - Pro",
};

type EditRoundProps = {
  params: Promise<{ roundId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeLeague(value: string | undefined): LeagueType {
  if (!value) {
    return LeagueType.ADULT_AMATEUR;
  }

  if (Object.values(LeagueType).includes(value as LeagueType)) {
    return value as LeagueType;
  }

  return LeagueType.ADULT_AMATEUR;
}

export default async function EditRoundPage({ params, searchParams }: EditRoundProps) {
  const { roundId } = await params;
  const resolved = (await searchParams) ?? {};
  const selectedLeague = normalizeLeague(getValue(resolved.league));

  const [round, drivers] = await Promise.all([
    prisma.round.findUnique({
      where: { id: roundId },
      include: {
        season: {
          include: {
            year: true,
          },
        },
        results: {
          where: { leagueType: selectedLeague },
        },
      },
    }),
    prisma.driver.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!round) {
    notFound();
  }

  const resultByDriver = new Map(round.results.map((result) => [result.driverId, result]));

  return (
    <main className="container">
      <section className="card stack-sm">
        <p className="eyebrow">
          {round.season.year.label} - {round.season.name}
        </p>
        <h1>Edit Round {round.roundNumber}</h1>
        <p className="muted">You can correct existing entries, add new drivers, and refresh best-lap bonus scoring.</p>

        <form action={updateRoundMeta} className="grid two">
          <input type="hidden" name="roundId" value={round.id} />
          <label>
            Round Number
            <input name="roundNumber" defaultValue={round.roundNumber} type="number" min={1} required />
          </label>
          <label>
            Week Starting
            <input
              name="weekStarting"
              type="date"
              defaultValue={round.weekStarting ? round.weekStarting.toISOString().slice(0, 10) : ""}
            />
          </label>
          <label className="full">
            Notes
            <textarea name="notes" rows={3} defaultValue={round.notes ?? ""} />
          </label>
          <button className="full" type="submit">
            Save Round Details
          </button>
        </form>
      </section>

      <section className="card stack-sm">
        <form action="" method="get" className="split-mobile">
          <label>
            League
            <select name="league" defaultValue={selectedLeague}>
              {Object.values(LeagueType).map((league) => (
                <option value={league} key={league}>
                  {LEAGUE_LABELS[league]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Switch League</button>
        </form>

        <h2>{LEAGUE_LABELS[selectedLeague]}</h2>
        <form action={saveRoundLeague} className="stack-sm">
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="leagueType" value={selectedLeague} />

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Use</th>
                  <th>Driver</th>
                  <th>Position</th>
                  <th>Base Points</th>
                  <th>Flat Times</th>
                  <th>Fastest Lap</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => {
                  const result = resultByDriver.get(driver.id);
                  return (
                    <tr key={driver.id}>
                      <td>
                        <input type="checkbox" name={`entry_${driver.id}_enabled`} defaultChecked={Boolean(result)} />
                      </td>
                      <td>{driver.name}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          name={`entry_${driver.id}_position`}
                          defaultValue={result?.position ?? ""}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          name={`entry_${driver.id}_points`}
                          defaultValue={result?.pointsEarned ?? ""}
                        />
                      </td>
                      <td>
                        <input type="number" min={0} name={`entry_${driver.id}_flat`} defaultValue={result?.flatTimes ?? 0} />
                      </td>
                      <td>
                        <input
                          name={`entry_${driver.id}_lap`}
                          placeholder="35.000"
                          defaultValue={result?.fastestLapMs ? formatMs(result.fastestLapMs) : ""}
                        />
                      </td>
                    </tr>
                  );
                })}

                {[0, 1, 2, 3, 4].map((idx) => (
                  <tr key={`new-${idx}`}>
                    <td>
                      <input type="checkbox" name={`new_${idx}_enabled`} />
                    </td>
                    <td>
                      <input name={`new_${idx}_name`} placeholder="New driver name" />
                    </td>
                    <td>
                      <input type="number" min={1} name={`new_${idx}_position`} />
                    </td>
                    <td>
                      <input type="number" min={0} name={`new_${idx}_points`} />
                    </td>
                    <td>
                      <input type="number" min={0} name={`new_${idx}_flat`} defaultValue={0} />
                    </td>
                    <td>
                      <input name={`new_${idx}_lap`} placeholder="35.000" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small muted">
            Fastest lap bonus is automatically assigned (+1 point) to the best lap in this league for the round.
          </p>

          <button type="submit">Save League Results</button>
        </form>

        <div className="split-links">
          <Link href={`/rounds/${round.id}`}>View Round</Link>
          <Link href="/">Back to Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
