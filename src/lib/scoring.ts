export function parseLapToMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return null;
  }

  const [whole, fraction] = trimmed.split(".");
  const seconds = Number(whole);
  const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));

  return seconds * 1000 + milliseconds;
}

export function formatMs(ms: number | null): string {
  if (ms === null) {
    return "-";
  }

  const seconds = Math.floor(ms / 1000);
  const millis = String(ms % 1000).padStart(3, "0");
  return `${seconds}.${millis}`;
}

export function totalPoints(pointsEarned: number, flatTimes: number, bestLapBonus: boolean): number {
  return pointsEarned + flatTimes + (bestLapBonus ? 1 : 0);
}
