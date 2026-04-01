import Link from "next/link";

import { createRound } from "@/app/actions";
import { prisma } from "@/lib/prisma";

type NewRoundProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function NewRoundPage({ searchParams }: NewRoundProps) {
  const resolved = (await searchParams) ?? {};
  const seasonId = getValue(resolved.seasonId);

  const seasons = await prisma.season.findMany({
    include: { year: true },
    orderBy: [{ year: { label: "desc" } }, { number: "asc" }],
  });

  return (
    <main className="container">
      <section className="card stack-sm">
        <p className="eyebrow">Round Setup</p>
        <h1>Create New Round</h1>
        <p className="muted">A round represents one week of races. Save this first, then enter race results.</p>

        <form action={createRound} className="stack-sm">
          <label>
            Season
            <select name="seasonId" defaultValue={seasonId ?? ""} required>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.year.label} - {season.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Round Number
            <input name="roundNumber" type="number" min={1} max={52} required />
          </label>

          <label>
            Week Starting
            <input name="weekStarting" type="date" />
          </label>

          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Optional notes for this round" />
          </label>

          <button type="submit">Create Round</button>
        </form>

        <Link className="button-link subtle" href="/">
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
