import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRoundMeta } from "@/app/actions";
import RoundResultsEditor from "@/components/round-results-editor";
import { LeagueType, RaceDay } from "@/generated/prisma/enums";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

function normalizeDay(value: string | undefined): RaceDay {
  if (!value) {
    return RaceDay.TUESDAY;
  }

  if (Object.values(RaceDay).includes(value as RaceDay)) {
    return value as RaceDay;
  }

  return RaceDay.TUESDAY;
}

export default async function EditRoundPage({ params, searchParams }: EditRoundProps) {
  await requireAuth();

  const { roundId } = await params;
  const resolved = (await searchParams) ?? {};
  const selectedLeague = normalizeLeague(getValue(resolved.league));
  const selectedDay = normalizeDay(getValue(resolved.day));
  const saved = getValue(resolved.saved);
  const detailsSaved = saved === "details";
  const resultsSaved = saved === "results";

  const [round, allDrivers] = await Promise.all([
    prisma.round.findUnique({
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
          orderBy: {
            position: "asc",
          },
          include: {
            driver: true,
          },
        },
      },
    }),
    prisma.driver.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!round) {
    notFound();
  }

  return (
    <main className="container">
      <section className="card stack-sm">
        <p className="eyebrow">
          {round.season.year.label} - {round.season.name}
        </p>
        <div className="title-with-back">
          <Link className="small-button back-arrow-button" href="/" aria-label="Back to dashboard">
            &lt;
          </Link>
          <h1>Edit Round {round.roundNumber}</h1>
        </div>
        <p className="muted">You can correct existing entries, add new drivers, and refresh best-lap bonus scoring.</p>

        <form action={updateRoundMeta} className="grid two">
          <input type="hidden" name="roundId" value={round.id} />
          <input type="hidden" name="leagueType" value={selectedLeague} />
          <input type="hidden" name="raceDay" value={selectedDay} />
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
          <div className="full save-submit-wrap">
            <button className="small-button" type="submit">
              Save Round Details
            </button>
            {detailsSaved ? (
              <span className="save-success-tick" aria-label="Round details saved" title="Saved">
                {"\u2713"}
              </span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card stack-sm">
        <RoundResultsEditor
          roundId={round.id}
          leagueType={selectedLeague}
          raceDay={selectedDay}
          allDrivers={allDrivers}
          existingResults={round.results.map((result) => ({
            driverId: result.driverId,
            driverName: result.driver.name,
            position: result.position,
            pointsEarned: result.pointsEarned,
            flatTimes: result.flatTimes,
            fastestLapMs: result.fastestLapMs,
          }))}
          saveSucceeded={resultsSaved}
        />

        <div className="split-links">
          <Link className="small-button" href={`/rounds/${round.id}`}>
            View Round
          </Link>
        </div>
      </section>
    </main>
  );
}
