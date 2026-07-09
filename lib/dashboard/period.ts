import { PeriodType } from "@/app/generated/prisma/enums";
import {
  formatDateInTz,
  getPeriodBounds,
  monthInputToReferenceDate,
  pickerValueFromReferenceDate,
  todayDateString,
} from "@/lib/periods";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function defaultReferenceDateForType(
  type: PeriodType,
  today = todayDateString(),
): string {
  switch (type) {
    case PeriodType.DAILY:
      return today;
    case PeriodType.MONTHLY:
      return monthInputToReferenceDate(today.slice(0, 7));
    case PeriodType.WEEKLY:
    default:
      return pickerValueFromReferenceDate(PeriodType.WEEKLY, today);
  }
}

export function formatDashboardTimestamp(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function periodStartIso(date: Date): string {
  return formatDateInTz(date);
}

export function isValidReferenceDate(value: string | undefined): value is string {
  return !!value && DATE_RE.test(value);
}

export function resolveReferenceDate(
  type: PeriodType,
  dateParam: string | undefined,
): string {
  if (isValidReferenceDate(dateParam)) {
    return dateParam;
  }
  return defaultReferenceDateForType(type);
}

export function periodBoundsFromFilters(
  type: PeriodType,
  referenceDate: string,
) {
  return getPeriodBounds(type, referenceDate);
}
