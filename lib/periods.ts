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

/** Sunday–Saturday week containing the reference date. */
function getWeekBounds(ref: Date, tz: string): PeriodBounds {
  const dateStr = formatDateInTz(ref, tz);
  const dayOfWeek = getDayOfWeek(dateStr, tz);
  const sunday = addDays(dateStr, -dayOfWeek);
  const saturday = addDays(sunday, 6);

  return {
    periodStart: parseDateString(sunday),
    periodEnd: parseDateString(saturday),
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

function daysBetween(startStr: string, endStr: string): number {
  const start = parseDateString(startStr).getTime();
  const end = parseDateString(endStr).getTime();
  return Math.round((end - start) / 86_400_000);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthName(month: number, year: number, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: tz,
  }).format(parseDateString(`${year}-${String(month).padStart(2, "0")}-01`));
}

/** Week number within a calendar month (Sunday-start weeks). */
export function getWeekOfMonthInfo(
  sundayStr: string,
  tz = getOrgTimezone(),
): { weekNum: number; month: number; year: number; monthLabel: string } {
  const saturdayStr = addDays(sundayStr, 6);
  const [, startMonth] = sundayStr.split("-").map(Number);
  const [endYear, endMonth] = saturdayStr.split("-").map(Number);

  const month = startMonth !== endMonth ? endMonth : startMonth;
  const year = startMonth !== endMonth ? endYear : Number(sundayStr.split("-")[0]);

  const firstOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const firstWeekSunday = addDays(firstOfMonth, -getDayOfWeek(firstOfMonth, tz));
  const weekNum = Math.floor(daysBetween(firstWeekSunday, sundayStr) / 7) + 1;

  return {
    weekNum,
    month,
    year,
    monthLabel: monthName(month, year, tz),
  };
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
    case PeriodType.WEEKLY: {
      const { weekNum, year, monthLabel } = getWeekOfMonthInfo(start, tz);
      return `Week ${weekNum} of ${monthLabel} ${year} · ${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
    }
    case PeriodType.MONTHLY: {
      const [year, month] = start.split("-").map(Number);
      return `${monthName(month, year, tz)} ${year}`;
    }
    default:
      return start;
  }
}

function formatDisplayDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

/** Sunday-start weeks that overlap a calendar month. */
export type WeekOption = {
  sunday: string;
  weekNum: number;
  label: string;
};

export function listWeeksInMonth(
  monthValue: string,
  tz = getOrgTimezone(),
): WeekOption[] {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) {
    return [];
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const firstOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = daysInMonth(year, month);
  const lastOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const firstWeekSunday = addDays(firstOfMonth, -getDayOfWeek(firstOfMonth, tz));
  const weeks: WeekOption[] = [];

  for (
    let sunday = firstWeekSunday;
    sunday <= lastOfMonth || addDays(sunday, 6) >= firstOfMonth;
    sunday = addDays(sunday, 7)
  ) {
    const saturday = addDays(sunday, 6);
    const overlaps = sunday <= lastOfMonth && saturday >= firstOfMonth;
    if (!overlaps) {
      if (sunday > lastOfMonth) {
        break;
      }
      continue;
    }

    const { weekNum } = getWeekOfMonthInfo(sunday, tz);
    weeks.push({
      sunday,
      weekNum,
      label: `Week ${weekNum}: ${formatDisplayDate(sunday)} – ${formatDisplayDate(saturday)}`,
    });

    if (sunday > lastOfMonth) {
      break;
    }
  }

  return weeks;
}

export function weekPickerMonthFromReference(
  referenceDate: string,
  tz = getOrgTimezone(),
): string {
  const { periodStart } = getPeriodBounds(PeriodType.WEEKLY, referenceDate, tz);
  const sunday = formatDateInTz(periodStart, tz);
  const { month, year } = getWeekOfMonthInfo(sunday, tz);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function sundayFromWeekPicker(
  monthValue: string,
  sunday: string,
  tz = getOrgTimezone(),
): string {
  const weeks = listWeeksInMonth(monthValue, tz);
  if (weeks.some((w) => w.sunday === sunday)) {
    return sunday;
  }
  return weeks[0]?.sunday ?? monthInputToReferenceDate(monthValue);
}

/** Map a date to an HTML week-input value (ISO — avoid for Sunday-start UX). */
export function dateToWeekInputValue(dateStr: string, tz = getOrgTimezone()): string {
  const { periodStart } = getWeekBounds(parseDateString(dateStr), tz);
  const sunday = formatDateInTz(periodStart, tz);
  const wednesday = addDays(sunday, 3);
  const date = parseDateString(wednesday);
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** HTML week value → Sunday (start of our Sun–Sat week). */
export function weekInputToReferenceDate(weekValue: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!match) {
    throw new Error("Invalid week value.");
  }
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const isoDay = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - isoDay + 1);
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  monday.setUTCDate(monday.getUTCDate() - 1);
  return monday.toISOString().slice(0, 10);
}

export function dateToMonthInputValue(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function monthInputToReferenceDate(monthValue: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) {
    throw new Error("Invalid month value.");
  }
  return `${match[1]}-${match[2]}-01`;
}

export function periodPickerLabel(type: PeriodType): string {
  switch (type) {
    case PeriodType.DAILY:
      return "Date";
    case PeriodType.WEEKLY:
      return "Week";
    case PeriodType.MONTHLY:
      return "Month";
    default:
      return "Period";
  }
}

export function periodPickerInputType(
  type: PeriodType,
): "date" | "month" | "week-custom" {
  switch (type) {
    case PeriodType.WEEKLY:
      return "week-custom";
    case PeriodType.MONTHLY:
      return "month";
    default:
      return "date";
  }
}

export function referenceDateFromPicker(
  type: PeriodType,
  pickerValue: string,
): string {
  switch (type) {
    case PeriodType.WEEKLY:
      return pickerValue;
    case PeriodType.MONTHLY:
      return monthInputToReferenceDate(pickerValue);
    default:
      return pickerValue;
  }
}

export function pickerValueFromReferenceDate(
  type: PeriodType,
  referenceDate: string,
  tz = getOrgTimezone(),
): string {
  switch (type) {
    case PeriodType.WEEKLY: {
      const { periodStart } = getPeriodBounds(PeriodType.WEEKLY, referenceDate, tz);
      return formatDateInTz(periodStart, tz);
    }
    case PeriodType.MONTHLY:
      return dateToMonthInputValue(referenceDate);
    default:
      return referenceDate;
  }
}

export function formatPeriodPreview(
  type: PeriodType,
  referenceDate: string,
  tz = getOrgTimezone(),
): string | null {
  if (type === PeriodType.DAILY) {
    return null;
  }

  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDate, tz);
  return formatPeriodLabel(type, periodStart, periodEnd, tz);
}

/** True when today is after the period end date. */
export function isPeriodPast(
  periodEnd: Date,
  tz = getOrgTimezone(),
): boolean {
  const today = todayDateString(tz);
  const end = formatDateInTz(periodEnd, tz);
  return today > end;
}

/** Calendar month bounds (first–last day) containing a reference date. */
export function getMonthBoundsForDate(
  referenceDateStr: string,
  tz = getOrgTimezone(),
): PeriodBounds {
  return getMonthBounds(parseDateString(referenceDateStr), tz);
}
