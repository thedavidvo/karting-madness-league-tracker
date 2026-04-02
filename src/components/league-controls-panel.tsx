"use client";

import { useState } from "react";

import { createLeagueYear, createSeason } from "@/app/actions";
import LeagueFiltersForm from "@/components/league-filters-form";

type YearOption = {
  id: string;
  label: number;
};

type SeasonOption = {
  id: string;
  name: string;
};

type Option = {
  value: string;
  label: string;
};

type LeagueControlsPanelProps = {
  years: YearOption[];
  seasons: SeasonOption[];
  selectedYear?: string;
  selectedSeason?: string;
  selectedYearId?: string;
  selectedYearLabel?: string;
  selectedLeague: string;
  selectedDay: string;
  leagueOptions: Option[];
  dayOptions: Option[];
};

export default function LeagueControlsPanel(props: LeagueControlsPanelProps) {
  const [openPanel, setOpenPanel] = useState<"year" | "season" | null>(null);

  return (
    <section className="card stack-sm">
      <h2>League Controls</h2>

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
            <input type="hidden" name="yearId" value={props.selectedYearId ?? ""} />
            <p className="small muted">Adding season to: {props.selectedYearLabel ?? "No year selected"}</p>
            <label>
              Season Name
              <input
                name="seasonName"
                type="text"
                placeholder="i.e. Winter"
                required
                disabled={props.years.length === 0 || !props.selectedYearId}
              />
            </label>
            <button type="submit" disabled={props.years.length === 0 || !props.selectedYearId}>
              Create Season
            </button>
            {props.years.length === 0 ? <p className="small muted">Create a year first.</p> : null}
          </form>
        </div>
      ) : null}

      <div className="control-divider" />

      <LeagueFiltersForm
        years={props.years}
        seasons={props.seasons}
        selectedYear={props.selectedYear}
        selectedSeason={props.selectedSeason}
        selectedLeague={props.selectedLeague}
        selectedDay={props.selectedDay}
        leagueOptions={props.leagueOptions}
        dayOptions={props.dayOptions}
      />
    </section>
  );
}
