import { PeriodType } from "@/app/generated/prisma/enums";
import {
  periodBoundsFromFilters,
  resolveReferenceDate,
} from "@/lib/dashboard/period";

export type DashboardSearchParams = {
  type?: string;
  date?: string;
  sort?: string;
  dir?: string;
};

export type DashboardSortKey = "name" | "completion" | "hours";
export type DashboardSortDir = "asc" | "desc";

export type DashboardFilters = {
  periodType: PeriodType;
  referenceDate: string;
  periodStart: Date;
  periodEnd: Date;
  sort: DashboardSortKey;
  dir: DashboardSortDir;
};

const VALID_TYPES = new Set<string>(Object.values(PeriodType));
const VALID_SORT = new Set(["name", "completion", "hours"]);
const VALID_DIR = new Set(["asc", "desc"]);

export function parseDashboardFilters(
  params: DashboardSearchParams,
): DashboardFilters {
  const periodType: PeriodType = VALID_TYPES.has(params.type ?? "")
    ? (params.type as PeriodType)
    : PeriodType.WEEKLY;

  const referenceDate = resolveReferenceDate(periodType, params.date);
  const { periodStart, periodEnd } = periodBoundsFromFilters(
    periodType,
    referenceDate,
  );

  const sort: DashboardSortKey = VALID_SORT.has(params.sort ?? "")
    ? (params.sort as DashboardSortKey)
    : "name";
  const dir: DashboardSortDir = VALID_DIR.has(params.dir ?? "")
    ? (params.dir as DashboardSortDir)
    : sort === "name"
      ? "asc"
      : "desc";

  return { periodType, referenceDate, periodStart, periodEnd, sort, dir };
}

export function dashboardFiltersToSearchParams(
  filters: DashboardFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.periodType !== PeriodType.WEEKLY) {
    params.set("type", filters.periodType);
  }
  params.set("date", filters.referenceDate);

  if (filters.sort !== "name") {
    params.set("sort", filters.sort);
  }
  if (!(filters.sort === "name" && filters.dir === "asc")) {
    params.set("dir", filters.dir);
  }

  return params;
}
