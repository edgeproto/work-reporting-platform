/** Generate YYYY-MM-DD strings for every day in [start, end] inclusive. */
export function* dateRange(start: string, end: string): Generator<string> {
  let current = start;
  while (current <= end) {
    yield current;
    const [y, m, d] = current.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    current = next.toISOString().slice(0, 10);
    if (current > end && current !== end) {
      break;
    }
    if (current > end) {
      break;
    }
  }
}

export function allDatesInYear(year: number): string[] {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return [...dateRange(start, end)];
}

export function allMonthValues(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

export function mockFile(
  name: string,
  options: { type?: string; size?: number } = {},
): File {
  const size = options.size ?? 100;
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type: options.type ?? "" });
}
