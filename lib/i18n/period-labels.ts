import { PeriodType } from "@/app/generated/prisma/enums";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function periodTypeLabel(
  type: PeriodType,
  dict: Dictionary,
): string {
  switch (type) {
    case PeriodType.DAILY:
      return dict.periods.type.daily;
    case PeriodType.WEEKLY:
      return dict.periods.type.weekly;
    case PeriodType.MONTHLY:
      return dict.periods.type.monthly;
    default:
      return dict.periods.type.daily;
  }
}

export function periodPickerLabel(
  type: PeriodType,
  dict: Dictionary,
): string {
  switch (type) {
    case PeriodType.DAILY:
      return dict.periods.picker.date;
    case PeriodType.WEEKLY:
      return dict.periods.picker.week;
    case PeriodType.MONTHLY:
      return dict.periods.picker.month;
    default:
      return dict.periods.picker.period;
  }
}
