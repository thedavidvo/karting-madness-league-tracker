"use client";

import { useRef } from "react";

import { createRound } from "@/app/actions";

type AddRoundDialogProps = {
  seasonId: string;
  selectedLeague: string;
  selectedDay: string;
};

export default function AddRoundDialog({ seasonId, selectedLeague, selectedDay }: AddRoundDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openDialog = () => {
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button type="button" className="small-button" onClick={openDialog}>
        Add Round
      </button>

      <dialog ref={dialogRef} className="round-dialog">
        <div className="round-dialog-panel card stack-sm" role="dialog" aria-label="Add Round">
          <h3 className="round-dialog-title">Add New Round</h3>
          <form action={createRound} className="stack-sm" onSubmit={closeDialog}>
            <input type="hidden" name="seasonId" value={seasonId} />
            <input type="hidden" name="leagueType" value={selectedLeague} />
            <input type="hidden" name="raceDay" value={selectedDay} />
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
          <button type="button" className="button-link subtle" onClick={closeDialog}>
            Cancel
          </button>
        </div>
      </dialog>
    </>
  );
}
