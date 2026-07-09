import { PeriodType } from "@/app/generated/prisma/enums";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { Locale } from "@/lib/i18n/locales";
import {
  formatDateInTz,
  getOrgTimezone,
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

export function formatDashboardTimestamp(
  date: Date | string,
  options: { locale?: Locale; timeZone?: string } = {},
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const locale = options.locale ?? "en";
  const timeZone = options.timeZone ?? getOrgTimezone();
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
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
