"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { deleteRound } from "@/app/actions";
import AddRoundDialog from "@/components/add-round-dialog";
import { formatMs, totalPoints } from "@/lib/scoring";

type RoundResult = {
  id: string;
  position: number;
  pointsEarned: number;
  flatTimes: number;
  bestLapBonus: boolean;
  fastestLapMs: number | null;
  driverName: string;
};

type RoundItem = {
  id: string;
  roundNumber: number;
  weekStarting: string | null;
  notes: string | null;
  results: RoundResult[];
};

type RoundsPanelProps = {
  seasonId: string;
  rounds: RoundItem[];
  initialRoundId?: string;
  selectedLeague: string;
  selectedDay: string;
  selectedLeagueLabel: string;
  selectedDayLabel: string;
};

export default function RoundsPanel({
  seasonId,
  rounds,
  initialRoundId,
  selectedLeague,
  selectedDay,
  selectedLeagueLabel,
  selectedDayLabel,
}: RoundsPanelProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(initialRoundId ?? rounds[0]?.id ?? null);

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId) ?? rounds[0] ?? null,
    [rounds, selectedRoundId],
  );

  const selectedRoundResults = useMemo(
    () =>
      [...(selectedRound?.results ?? [])].sort((a, b) => {
        if (a.position === b.position) {
          return a.driverName.localeCompare(b.driverName);
        }

        return a.position - b.position;
      }),
    [selectedRound],
  );

  return (
    <>
      <section className="card stack-sm">
        <div className="rounds-header">
          <h2>Rounds</h2>
          <AddRoundDialog seasonId={seasonId} selectedLeague={selectedLeague} selectedDay={selectedDay} />
        </div>

        <div className="round-grid">
          {rounds.length === 0 ? (
            <p className="muted">No rounds with results for this league/day yet. Create a round and enter results to show it here.</p>
          ) : (
            rounds.map((round) => (
              <article className={`round-item${selectedRound?.id === round.id ? " is-selected" : ""}`} key={round.id}>
                <button
                  type="button"
                  className="round-card-link round-select-button"
                  onClick={() => setSelectedRoundId(round.id)}
                  aria-pressed={selectedRound?.id === round.id}
                >
                  <div>
                    <h3>Round {round.roundNumber}</h3>
                    <p className="small muted">{round.weekStarting ? new Date(round.weekStarting).toDateString() : "No date set"}</p>
                  </div>
                  <span className="small round-card-meta">
                    {round.results.length} result{round.results.length === 1 ? "" : "s"}
                  </span>
                </button>

                <div className="split-links">
                  <Link className="small-button" href={`/rounds/${round.id}/edit?league=${selectedLeague}&day=${selectedDay}`}>
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

      {selectedRound ? (
        <section className="card stack-sm">
          <div className="actions-row">
            <div>
              <p className="eyebrow">Selected Round</p>
              <h2>Round {selectedRound.roundNumber} Results</h2>
              <p className="small muted">
                {selectedRound.weekStarting ? new Date(selectedRound.weekStarting).toDateString() : "No week start date provided"}
              </p>
              <p className="small muted">
                {selectedLeagueLabel} - {selectedDayLabel}
              </p>
            </div>
            <Link className="small-button" href={`/rounds/${selectedRound.id}/edit?league=${selectedLeague}&day=${selectedDay}`}>
              Edit Round
            </Link>
          </div>

          {selectedRound.notes ? <p>{selectedRound.notes}</p> : null}

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
                {selectedRoundResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No results entered for this league/day.
                    </td>
                  </tr>
                ) : (
                  selectedRoundResults.map((result) => (
                    <tr key={result.id}>
                      <td>{result.position}</td>
                      <td>{result.driverName}</td>
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
      ) : null}
    </>
  );
}
