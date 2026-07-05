import {
  PeriodType,
  Visibility,
} from "@/app/generated/prisma/enums";
import {
  getPeriodBounds,
  parseDateString,
  todayDateString,
} from "@/lib/periods";

export type DateRangePreset = "today" | "week" | "month" | "custom" | "all";

export type TeamViewMode = "all" | "reports" | "plans";

export type TeamSearchParams = {
  range?: string;
  from?: string;
  to?: string;
  member?: string;
  type?: string;
  view?: string;
  task?: string;
  visibility?: string;
};

export type TeamFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  rangePreset: DateRangePreset;
  memberId?: string;
  periodType?: PeriodType;
  view: TeamViewMode;
  taskTitleId?: string;
  visibility?: Visibility;
};

const VALID_TYPES = new Set<string>(Object.values(PeriodType));
const VALID_VISIBILITY = new Set<string>(Object.values(Visibility));
const VALID_VIEWS = new Set<string>(["all", "reports", "plans"]);
const VALID_RANGES = new Set<string>(["today", "week", "month", "custom", "all"]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTeamFilters(params: TeamSearchParams): TeamFilters {
  const rangePreset: DateRangePreset = VALID_RANGES.has(params.range ?? "")
    ? (params.range as DateRangePreset)
    : "week";

  const { dateFrom, dateTo } = resolveDateRange(rangePreset, params.from, params.to);

  const periodType =
    params.type && VALID_TYPES.has(params.type)
      ? (params.type as PeriodType)
      : undefined;

  const view: TeamViewMode =
    params.view && VALID_VIEWS.has(params.view)
      ? (params.view as TeamViewMode)
      : "all";

  const taskTitleId = params.task?.trim() || undefined;

  const visibility =
    params.visibility && VALID_VISIBILITY.has(params.visibility)
      ? (params.visibility as Visibility)
      : undefined;

  const memberId = params.member?.trim() || undefined;

  return {
    dateFrom,
    dateTo,
    rangePreset,
    memberId,
    periodType,
    view,
    taskTitleId,
    visibility,
  };
}

function resolveDateRange(
  preset: DateRangePreset,
  from?: string,
  to?: string,
): { dateFrom?: Date; dateTo?: Date } {
  const today = todayDateString();

  switch (preset) {
    case "today": {
      const day = parseDateString(today);
      return { dateFrom: day, dateTo: day };
    }
    case "week": {
      const bounds = getPeriodBounds(PeriodType.WEEKLY, today);
      return { dateFrom: bounds.periodStart, dateTo: bounds.periodEnd };
    }
    case "month": {
      const bounds = getPeriodBounds(PeriodType.MONTHLY, today);
      return { dateFrom: bounds.periodStart, dateTo: bounds.periodEnd };
    }
    case "custom": {
      if (from && to && DATE_RE.test(from) && DATE_RE.test(to)) {
        return {
          dateFrom: parseDateString(from),
          dateTo: parseDateString(to),
        };
      }
      return {};
    }
    case "all":
    default:
      return {};
  }
}

export function teamFiltersToSearchParams(filters: TeamFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.rangePreset !== "week") {
    params.set("range", filters.rangePreset);
  }

  if (filters.rangePreset === "custom" && filters.dateFrom && filters.dateTo) {
    params.set("from", filters.dateFrom.toISOString().slice(0, 10));
    params.set("to", filters.dateTo.toISOString().slice(0, 10));
  }

  if (filters.memberId) {
    params.set("member", filters.memberId);
  }

  if (filters.periodType) {
    params.set("type", filters.periodType);
  }

  if (filters.view !== "all") {
    params.set("view", filters.view);
  }

  if (filters.taskTitleId) {
    params.set("task", filters.taskTitleId);
  }

  if (filters.visibility) {
    params.set("visibility", filters.visibility);
  }

  return params;
}
