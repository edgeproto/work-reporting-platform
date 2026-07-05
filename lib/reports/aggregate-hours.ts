type HoursEntry = {
  hours: { toString(): string } | number | null | undefined;
};

export function aggregateHours(entries: HoursEntry[]): number {
  return entries.reduce((sum, entry) => {
    const value = Number(entry.hours ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function formatHoursTotal(hours: number): string {
  return `${hours.toFixed(1)} h`;
}
