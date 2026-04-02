"use client";

import { useState } from "react";

import { createLeagueYear, createSeason } from "@/app/actions";

type YearOption = {
  id: string;
  label: number;
};

type LeagueSetupQuickActionsProps = {
  years: YearOption[];
  selectedYearId?: string;
  selectedYearLabel?: string;
};

export default function LeagueSetupQuickActions({
  years,
  selectedYearId,
  selectedYearLabel,
}: LeagueSetupQuickActionsProps) {
  const [openPanel, setOpenPanel] = useState<"year" | "season" | null>(null);

  return (
    <div className="stack-sm">
      <div className="quick-actions">
        <button
          type="button"
          className="small-button"
          onClick={() => setOpenPanel((current) => (current === "year" ? null : "year"))}
        >
          Add Year
        </button>
        <button
          type="button"
          className="small-button"
          onClick={() => setOpenPanel((current) => (current === "season" ? null : "season"))}
        >
          Add Season
        </button>
      </div>

      {openPanel === "year" ? (
        <div className="quick-panel card stack-sm">
          <form action={createLeagueYear} className="stack-sm compact-form" onSubmit={() => setOpenPanel(null)}>
            <label>
              Year Label
              <input name="year" type="number" min={2020} max={2100} defaultValue={new Date().getFullYear()} required />
            </label>
            <button type="submit">Create Year</button>
          </form>
        </div>
      ) : null}

      {openPanel === "season" ? (
        <div className="quick-panel card stack-sm">
          <form action={createSeason} className="stack-sm compact-form" onSubmit={() => setOpenPanel(null)}>
            <input type="hidden" name="yearId" value={selectedYearId ?? ""} />
            <p className="small muted">Adding season to: {selectedYearLabel ?? "No year selected"}</p>
            <label>
              Season Name
              <input
                name="seasonName"
                type="text"
                placeholder="Season 1"
                required
                disabled={years.length === 0 || !selectedYearId}
              />
            </label>
            <button type="submit" disabled={years.length === 0 || !selectedYearId}>
              Create Season
            </button>
            {years.length === 0 ? <p className="small muted">Create a year first.</p> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
