"use client";

import { useRef } from "react";

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

type LeagueFiltersFormProps = {
  years: YearOption[];
  seasons: SeasonOption[];
  selectedYear?: string;
  selectedSeason?: string;
  selectedLeague: string;
  selectedDay: string;
  leagueOptions: Option[];
  dayOptions: Option[];
  actionPath?: string;
};

export default function LeagueFiltersForm(props: LeagueFiltersFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const submitFilters = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form action={props.actionPath ?? "/"} method="get" className="stack-sm" ref={formRef}>
      <label>
        View Year
        <select name="year" defaultValue={props.selectedYear ?? ""} onChange={submitFilters}>
          {props.years.map((year) => (
            <option value={year.label} key={year.id}>
              {year.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        View Season
        <select name="season" defaultValue={props.selectedSeason ?? ""} onChange={submitFilters}>
          {props.seasons.map((season) => (
            <option value={season.id} key={season.id}>
              {season.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Race Day
        <select name="day" defaultValue={props.selectedDay} onChange={submitFilters}>
          {props.dayOptions.map((day) => (
            <option value={day.value} key={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        League
        <select name="league" defaultValue={props.selectedLeague} onChange={submitFilters}>
          {props.leagueOptions.map((league) => (
            <option value={league.value} key={league.value}>
              {league.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
