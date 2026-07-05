import { PeriodType } from "@/app/generated/prisma/enums";

export function getOrgTimezone(): string {
  return process.env.TZ ?? "UTC";
}

/** Format a Date as YYYY-MM-DD in the org timezone. */
export function formatDateInTz(date: Date, tz = getOrgTimezone()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Parse YYYY-MM-DD to a UTC midnight Date for Prisma @db.Date. */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export type PeriodBounds = {
  periodStart: Date;
  periodEnd: Date;
};

export function getPeriodBounds(
  type: PeriodType,
  referenceDateStr: string,
  tz = getOrgTimezone(),
): PeriodBounds {
  const ref = parseDateString(referenceDateStr);

  switch (type) {
    case PeriodType.DAILY:
      return { periodStart: ref, periodEnd: ref };
    case PeriodType.WEEKLY:
      return getWeekBounds(ref, tz);
    case PeriodType.MONTHLY:
      return getMonthBounds(ref, tz);
    default:
      return { periodStart: ref, periodEnd: ref };
  }
}

/** ISO week: Monday start. */
function getWeekBounds(ref: Date, tz: string): PeriodBounds {
  const dateStr = formatDateInTz(ref, tz);
  const dayOfWeek = getDayOfWeek(dateStr, tz);
  const daysFromMonday = (dayOfWeek + 6) % 7;

  const monday = addDays(dateStr, -daysFromMonday);
  const sunday = addDays(monday, 6);

  return {
    periodStart: parseDateString(monday),
    periodEnd: parseDateString(sunday),
  };
}

function getMonthBounds(ref: Date, tz: string): PeriodBounds {
  const dateStr = formatDateInTz(ref, tz);
  const [year, month] = dateStr.split("-").map(Number);
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDayNum = daysInMonth(year, month);
  const lastDay = `${year}-${String(month).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  return {
    periodStart: parseDateString(firstDay),
    periodEnd: parseDateString(lastDay),
  };
}

function getDayOfWeek(dateStr: string, tz: string): number {
  const date = parseDateString(dateStr);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

function addDays(dateStr: string, days: number): string {
  const date = parseDateString(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatPeriodLabel(
  type: PeriodType,
  periodStart: Date,
  periodEnd: Date,
  tz = getOrgTimezone(),
): string {
  const start = formatDateInTz(periodStart, tz);
  const end = formatDateInTz(periodEnd, tz);

  switch (type) {
    case PeriodType.DAILY:
      return formatDisplayDate(start);
    case PeriodType.WEEKLY:
      return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
    case PeriodType.MONTHLY: {
      const [year, month] = start.split("-");
      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: tz,
      }).format(parseDateString(`${year}-${month}-01`));
      return `${monthName} ${year}`;
    }
    default:
      return start;
  }
}

function formatDisplayDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function periodTypeLabel(type: PeriodType): string {
  switch (type) {
    case PeriodType.DAILY:
      return "Daily";
    case PeriodType.WEEKLY:
      return "Weekly";
    case PeriodType.MONTHLY:
      return "Monthly";
    default:
      return type;
  }
}

export function todayDateString(tz = getOrgTimezone()): string {
  return formatDateInTz(new Date(), tz);
}
