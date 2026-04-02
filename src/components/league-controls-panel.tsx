"use client";

import { useState } from "react";

import { createLeagueYear, createSeason, deleteLeagueYear, deleteSeason } from "@/app/actions";
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
  const [openPanel, setOpenPanel] = useState<"year" | "season" | "delete-year" | "delete-season" | null>(null);
  const selectedSeasonName = props.seasons.find((season) => season.id === props.selectedSeason)?.name;

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

      <div className="quick-actions quick-actions-bottom">
        <button
          type="button"
          className="small-button danger-button"
          onClick={() => setOpenPanel((current) => (current === "delete-year" ? null : "delete-year"))}
          disabled={!props.selectedYearId}
        >
          Delete Year
        </button>
        <button
          type="button"
          className="small-button danger-button"
          onClick={() => setOpenPanel((current) => (current === "delete-season" ? null : "delete-season"))}
          disabled={!props.selectedSeason}
        >
          Delete Season
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

      {openPanel === "delete-season" ? (
        <div className="quick-panel card stack-sm">
          <form
            action={deleteSeason}
            className="stack-sm compact-form"
            onSubmit={(event) => {
              if (!window.confirm(`Delete season ${selectedSeasonName ?? "selected season"}? This will delete all linked rounds and results.`)) {
                event.preventDefault();
                return;
              }

              setOpenPanel(null);
            }}
          >
            <input type="hidden" name="seasonId" value={props.selectedSeason ?? ""} />
            <p className="small muted">Delete season: {selectedSeasonName ?? "No season selected"}</p>
            <p className="small muted">All rounds and results in this season will be permanently removed.</p>
            <button type="submit" className="danger-button" disabled={!props.selectedSeason}>
              Confirm Delete Season
            </button>
          </form>
        </div>
      ) : null}

      {openPanel === "delete-year" ? (
        <div className="quick-panel card stack-sm">
          <form
            action={deleteLeagueYear}
            className="stack-sm compact-form"
            onSubmit={(event) => {
              if (!window.confirm(`Delete year ${props.selectedYearLabel ?? "selected year"}? This will delete all linked seasons, rounds, and results.`)) {
                event.preventDefault();
                return;
              }

              setOpenPanel(null);
            }}
          >
            <input type="hidden" name="yearId" value={props.selectedYearId ?? ""} />
            <p className="small muted">Delete year: {props.selectedYearLabel ?? "No year selected"}</p>
            <p className="small muted">All seasons, rounds, and results in this year will be permanently removed.</p>
            <button type="submit" className="danger-button" disabled={!props.selectedYearId}>
              Confirm Delete Year
            </button>
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
