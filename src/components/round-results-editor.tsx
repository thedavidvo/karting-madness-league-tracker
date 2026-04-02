"use client";

import { useMemo, useState } from "react";

import { saveRoundLeague } from "@/app/actions";
import { RaceDay, LeagueType } from "@/generated/prisma/enums";
import { formatMs } from "@/lib/scoring";

type ExistingResult = {
  driverId: string;
  driverName: string;
  position: number;
  pointsEarned: number;
  flatTimes: number;
  fastestLapMs: number | null;
};

type DriverOption = {
  id: string;
  name: string;
};

type RoundResultsEditorProps = {
  roundId: string;
  leagueType: LeagueType;
  raceDay: RaceDay;
  allDrivers: DriverOption[];
  existingResults: ExistingResult[];
  saveSucceeded?: boolean;
};

export default function RoundResultsEditor({
  roundId,
  leagueType,
  raceDay,
  allDrivers,
  existingResults,
  saveSucceeded = false,
}: RoundResultsEditorProps) {
  const [newDriverRows, setNewDriverRows] = useState([0]);
  const [nextRowId, setNextRowId] = useState(1);
  const [removedExistingDriverIds, setRemovedExistingDriverIds] = useState<string[]>([]);
  const [addedDriverIds, setAddedDriverIds] = useState<string[]>([]);
  const [addedDriverDefaultPositions, setAddedDriverDefaultPositions] = useState<Record<string, number>>({});
  const [driverSearch, setDriverSearch] = useState("");

  const existingDriverIds = existingResults.map((result) => result.driverId);

  const visibleExistingResults = useMemo(
    () => existingResults.filter((result) => !removedExistingDriverIds.includes(result.driverId)),
    [existingResults, removedExistingDriverIds],
  );

  const existingResultsByPosition = useMemo(
    () =>
      [...visibleExistingResults].sort((a, b) => {
        if (a.position === b.position) {
          return a.driverName.localeCompare(b.driverName);
        }

        return a.position - b.position;
      }),
    [visibleExistingResults],
  );

  const filteredDrivers = useMemo(() => {
    const query = driverSearch.trim().toLowerCase();
    if (!query) {
      return allDrivers;
    }

    return allDrivers.filter((driver) => driver.name.toLowerCase().includes(query));
  }, [allDrivers, driverSearch]);

  const isDriverInResultsTable = (driverId: string) => {
    const existingVisible = existingDriverIds.includes(driverId) && !removedExistingDriverIds.includes(driverId);
    return existingVisible || addedDriverIds.includes(driverId);
  };

  const removeExistingDriver = (driverId: string) => {
    setRemovedExistingDriverIds((current) => {
      if (current.includes(driverId)) {
        return current;
      }

      return [...current, driverId];
    });
  };

  const addNewDriverRow = () => {
    setNewDriverRows((current) => [...current, nextRowId]);
    setNextRowId((current) => current + 1);
  };

  const removeNewDriverRow = (rowId: number) => {
    setNewDriverRows((current) => current.filter((id) => id !== rowId));
  };

  const addDriverToResults = (driverId: string) => {
    if (existingDriverIds.includes(driverId)) {
      setRemovedExistingDriverIds((current) => current.filter((id) => id !== driverId));
      return;
    }

    const usedPositions = [
      ...visibleExistingResults.map((result) => result.position),
      ...addedDriverIds
        .map((id) => addedDriverDefaultPositions[id])
        .filter((position): position is number => typeof position === "number"),
    ];
    const nextPosition = (usedPositions.length === 0 ? 0 : Math.max(...usedPositions)) + 1;

    setAddedDriverDefaultPositions((current) => {
      if (typeof current[driverId] === "number") {
        return current;
      }

      return {
        ...current,
        [driverId]: nextPosition,
      };
    });

    setAddedDriverIds((current) => {
      if (current.includes(driverId)) {
        return current;
      }

      return [...current, driverId];
    });
  };

  const removeAddedDriver = (driverId: string) => {
    setAddedDriverIds((current) => current.filter((id) => id !== driverId));
    setAddedDriverDefaultPositions((current) => {
      if (!(driverId in current)) {
        return current;
      }

      const next = { ...current };
      delete next[driverId];
      return next;
    });
  };

  return (
    <form action={saveRoundLeague} className="stack-sm">
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="leagueType" value={leagueType} />
      <input type="hidden" name="raceDay" value={raceDay} />
      <input type="hidden" name="newDriverRowCount" value={newDriverRows.length} />
      {removedExistingDriverIds.map((driverId) => (
        <input key={driverId} type="hidden" name={`entry_${driverId}_removed`} value="1" />
      ))}

      <div className="results-editor-layout">
        <aside className="results-sidebar">
          <h3>All Drivers</h3>
          <input
            type="search"
            placeholder="Search drivers"
            value={driverSearch}
            onChange={(event) => setDriverSearch(event.target.value)}
          />
          <div className="driver-list">
            {allDrivers.length === 0 ? (
              <p className="small muted">No drivers created yet.</p>
            ) : filteredDrivers.length === 0 ? (
              <p className="small muted">No matching drivers.</p>
            ) : (
              filteredDrivers.map((driver) => {
                const inList = isDriverInResultsTable(driver.id);

                return (
                  <div className="driver-list-item" key={driver.id}>
                    <span className="small driver-name">{driver.name}</span>
                    <button
                      type="button"
                      className="small-button driver-add-button"
                      onClick={() => addDriverToResults(driver.id)}
                      disabled={inList}
                    >
                      {inList ? "Added" : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Position</th>
                <th>Base Points</th>
                <th>Flat Times</th>
                <th>Fastest Lap</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {existingResultsByPosition.map((result) => {
                  return (
                    <tr key={result.driverId}>
                      <td>{result.driverName}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          name={`entry_${result.driverId}_position`}
                          defaultValue={result.position}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          name={`entry_${result.driverId}_points`}
                          defaultValue={result.pointsEarned}
                        />
                      </td>
                      <td>
                        <input type="number" min={0} name={`entry_${result.driverId}_flat`} defaultValue={result.flatTimes} />
                      </td>
                      <td>
                        <input
                          name={`entry_${result.driverId}_lap`}
                          placeholder="35.000"
                          defaultValue={result.fastestLapMs ? formatMs(result.fastestLapMs) : ""}
                        />
                      </td>
                      <td>
                        <button type="button" className="small-button danger-button" onClick={() => removeExistingDriver(result.driverId)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {addedDriverIds.filter((driverId) => !existingDriverIds.includes(driverId)).map((driverId) => {
                const driver = allDrivers.find((item) => item.id === driverId);
                if (!driver) {
                  return null;
                }

                return (
                  <tr key={`added-${driverId}`}>
                    <td>{driver.name}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        name={`entry_${driverId}_position`}
                        defaultValue={addedDriverDefaultPositions[driverId]}
                      />
                    </td>
                    <td>
                      <input type="number" min={0} name={`entry_${driverId}_points`} />
                    </td>
                    <td>
                      <input type="number" min={0} name={`entry_${driverId}_flat`} defaultValue={0} />
                    </td>
                    <td>
                      <input name={`entry_${driverId}_lap`} placeholder="35.000" />
                    </td>
                    <td>
                      <button type="button" className="small-button danger-button" onClick={() => removeAddedDriver(driverId)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}

              {newDriverRows.map((rowId, idx) => (
                <tr key={`new-${rowId}`}>
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
                  <td>
                    <button type="button" className="small-button danger-button" onClick={() => removeNewDriverRow(rowId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="split-links">
        <button type="button" className="small-button" onClick={addNewDriverRow}>
          Add Driver
        </button>
        <div className="save-submit-wrap">
          <button type="submit" className="small-button">
            Save League Results
          </button>
          {saveSucceeded ? (
            <span className="save-success-tick" aria-label="Results saved" title="Saved">
              {"\u2713"}
            </span>
          ) : null}
        </div>
      </div>

      <p className="small muted">
        Use the sidebar to add existing drivers. Fill Position and Base Points to include a driver.
      </p>
      <p className="small muted">Fastest lap bonus is automatically assigned (+1 point) to the best lap in this league for the round.</p>
    </form>
  );
}
