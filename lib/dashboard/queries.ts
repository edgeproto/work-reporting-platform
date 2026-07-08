import {
  PeriodType,
  Role,
  SubmissionStatus,
  Visibility,
} from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  getPeriodBounds,
  parseDateString,
  todayDateString,
} from "@/lib/periods";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import { isAdmin, isManagerOrAbove } from "@/lib/rbac";
import { canViewPrivate } from "@/lib/visibility";

/** Admins are visible on the dashboard only to themselves and other admins. */
function canViewUserOnDashboard(
  viewer: Viewer,
  subject: { id: string; role: Role },
): boolean {
  if (viewer.id === subject.id) {
    return true;
  }
  if (subject.role === Role.ADMIN && !isAdmin(viewer)) {
    return false;
  }
  return true;
}

function ownerFilterForViewer(viewer: Viewer) {
  return isAdmin(viewer) ? {} : { user: { role: { not: Role.ADMIN } } };
}

export type DashboardRangePreset = "week" | "month" | "custom";

export type DashboardSearchParams = {
  range?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
};

export type DashboardSortKey = "name" | "completion" | "hours";
export type DashboardSortDir = "asc" | "desc";

export type DashboardFilters = {
  dateFrom: Date;
  dateTo: Date;
  rangePreset: DashboardRangePreset;
  sort: DashboardSortKey;
  dir: DashboardSortDir;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_RANGES = new Set(["week", "month", "custom"]);
const VALID_SORT = new Set(["name", "completion", "hours"]);
const VALID_DIR = new Set(["asc", "desc"]);

export function parseDashboardFilters(
  params: DashboardSearchParams,
): DashboardFilters {
  const rangePreset: DashboardRangePreset = VALID_RANGES.has(params.range ?? "")
    ? (params.range as DashboardRangePreset)
    : "week";

  const { dateFrom, dateTo } = resolveDateRange(
    rangePreset,
    params.from,
    params.to,
  );

  const sort: DashboardSortKey = VALID_SORT.has(params.sort ?? "")
    ? (params.sort as DashboardSortKey)
    : "name";
  const dir: DashboardSortDir = VALID_DIR.has(params.dir ?? "")
    ? (params.dir as DashboardSortDir)
    : sort === "name"
      ? "asc"
      : "desc";

  return { dateFrom, dateTo, rangePreset, sort, dir };
}

function resolveDateRange(
  preset: DashboardRangePreset,
  from?: string,
  to?: string,
): { dateFrom: Date; dateTo: Date } {
  const today = todayDateString();

  if (preset === "custom" && from && to && DATE_RE.test(from) && DATE_RE.test(to)) {
    return {
      dateFrom: parseDateString(from),
      dateTo: parseDateString(to),
    };
  }

  if (preset === "month") {
    const bounds = getPeriodBounds(PeriodType.MONTHLY, today);
    return { dateFrom: bounds.periodStart, dateTo: bounds.periodEnd };
  }

  const bounds = getPeriodBounds(PeriodType.WEEKLY, today);
  return { dateFrom: bounds.periodStart, dateTo: bounds.periodEnd };
}

type Viewer = {
  id: string;
  role: Role;
  organizationId: string;
};

export type MemberRosterRow = {
  id: string;
  name: string;
  role: Role;
  planItemCount: number;
  completedCount: number;
  completionPct: number | null;
  hours: number;
};

export async function fetchMemberRoster(
  viewer: Viewer,
  filters: DashboardFilters,
): Promise<MemberRosterRow[]> {
  const members = await db.user.findMany({
    where: { organizationId: viewer.organizationId, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const visibleMembers = members.filter((member) =>
    canViewUserOnDashboard(viewer, member),
  );

  const managerView = isManagerOrAbove(viewer);
  const ownerFilter = ownerFilterForViewer(viewer);

  const [planItems, reportEntries] = await Promise.all([
    db.planItem.findMany({
      where: {
        plan: {
          organizationId: viewer.organizationId,
          status: SubmissionStatus.SUBMITTED,
          periodStart: { gte: filters.dateFrom, lte: filters.dateTo },
          ...ownerFilter,
        },
        ...(managerView
          ? {}
          : {
              OR: [
                { visibility: Visibility.PUBLIC },
                { plan: { userId: viewer.id } },
              ],
            }),
      },
      select: {
        completedAt: true,
        visibility: true,
        plan: { select: { userId: true } },
      },
    }),
    db.reportEntry.findMany({
      where: {
        report: {
          organizationId: viewer.organizationId,
          status: SubmissionStatus.SUBMITTED,
          periodStart: { gte: filters.dateFrom, lte: filters.dateTo },
          ...ownerFilter,
        },
        ...(managerView
          ? {}
          : {
              OR: [
                { visibility: Visibility.PUBLIC },
                { report: { userId: viewer.id } },
              ],
            }),
      },
      select: {
        hours: true,
        visibility: true,
        report: { select: { userId: true } },
      },
    }),
  ]);

  const rows: MemberRosterRow[] = visibleMembers.map((member) => {
    const memberPlanItems = planItems.filter((item) => {
      if (item.plan.userId !== member.id) {
        return false;
      }
      if (
        item.visibility === Visibility.PRIVATE &&
        !canViewPrivate(viewer, member.id, viewer.id)
      ) {
        return false;
      }
      return true;
    });

    const memberEntries = reportEntries.filter((entry) => {
      if (entry.report.userId !== member.id) {
        return false;
      }
      if (
        entry.visibility === Visibility.PRIVATE &&
        !canViewPrivate(viewer, member.id, viewer.id)
      ) {
        return false;
      }
      return true;
    });

    const planItemCount = memberPlanItems.length;
    const completedCount = memberPlanItems.filter(
      (item) => item.completedAt != null,
    ).length;
    const hours = memberEntries.reduce(
      (sum, entry) => sum + (Number(entry.hours) || 0),
      0,
    );

    return {
      id: member.id,
      name: member.name,
      role: member.role,
      planItemCount,
      completedCount,
      completionPct:
        planItemCount === 0
          ? null
          : Math.round((completedCount / planItemCount) * 1000) / 10,
      hours,
    };
  });

  rows.sort((a, b) => {
    const factor = filters.dir === "asc" ? 1 : -1;
    switch (filters.sort) {
      case "completion": {
        const aVal = a.completionPct ?? -1;
        const bVal = b.completionPct ?? -1;
        return (aVal - bVal) * factor || a.name.localeCompare(b.name);
      }
      case "hours":
        return (a.hours - b.hours) * factor || a.name.localeCompare(b.name);
      case "name":
      default:
        return a.name.localeCompare(b.name) * factor;
    }
  });

  return rows;
}

export type MemberDetailData = {
  member: { id: string; name: string; role: Role };
  filters: DashboardFilters;
  plans: Array<{
    id: string;
    type: PeriodType;
    periodStart: Date;
    periodEnd: Date;
    submittedAt: Date | null;
    items: Array<{
      id: string;
      title: string;
      description: string | null;
      visibility: Visibility;
      completed: boolean;
    }>;
  }>;
  reports: Array<{
    id: string;
    type: PeriodType;
    periodStart: Date;
    periodEnd: Date;
    submittedAt: Date | null;
    entries: Array<{
      id: string;
      title: string;
      description: string | null;
      hours: number;
      visibility: Visibility;
    }>;
  }>;
  completionPct: number | null;
  totalHours: number;
};

export async function fetchMemberDetail(
  viewer: Viewer,
  memberId: string,
  filters: DashboardFilters,
): Promise<MemberDetailData | null> {
  const member = await db.user.findFirst({
    where: {
      id: memberId,
      organizationId: viewer.organizationId,
      isActive: true,
    },
    select: { id: true, name: true, role: true },
  });

  if (!member) {
    return null;
  }

  if (!canViewUserOnDashboard(viewer, member)) {
    return null;
  }

  const canSeePrivate = canViewPrivate(viewer, member.id, viewer.id);

  const [plans, reports] = await Promise.all([
    db.plan.findMany({
      where: {
        userId: member.id,
        organizationId: viewer.organizationId,
        status: SubmissionStatus.SUBMITTED,
        periodStart: { gte: filters.dateFrom, lte: filters.dateTo },
      },
      include: {
        items: {
          where: canSeePrivate ? undefined : { visibility: Visibility.PUBLIC },
          orderBy: { sortOrder: "asc" },
          include: { taskTitle: { select: { title: true } } },
        },
      },
      orderBy: [{ periodStart: "desc" }],
    }),
    db.report.findMany({
      where: {
        userId: member.id,
        organizationId: viewer.organizationId,
        status: SubmissionStatus.SUBMITTED,
        periodStart: { gte: filters.dateFrom, lte: filters.dateTo },
      },
      include: {
        entries: {
          where: canSeePrivate ? undefined : { visibility: Visibility.PUBLIC },
          orderBy: { sortOrder: "asc" },
          include: {
            taskTitle: { select: { title: true } },
            planItem: {
              select: {
                customTitle: true,
                taskTitle: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: [{ periodStart: "desc" }],
    }),
  ]);

  let completedCount = 0;
  let planItemCount = 0;
  let totalHours = 0;

  const serializedPlans = plans.map((plan) => {
    planItemCount += plan.items.length;
    completedCount += plan.items.filter((item) => item.completedAt).length;
    return {
      id: plan.id,
      type: plan.type,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      submittedAt: plan.submittedAt,
      items: plan.items.map((item) => ({
        id: item.id,
        title: getPlanItemTitle(item),
        description: item.description,
        visibility: item.visibility,
        completed: item.completedAt != null,
      })),
    };
  });

  const serializedReports = reports.map((report) => ({
    id: report.id,
    type: report.type,
    periodStart: report.periodStart,
    periodEnd: report.periodEnd,
    submittedAt: report.submittedAt,
    entries: report.entries.map((entry) => {
      const hours = Number(entry.hours) || 0;
      totalHours += hours;
      return {
        id: entry.id,
        title: getReportEntryTitle(entry),
        description: entry.description,
        hours,
        visibility: entry.visibility,
      };
    }),
  }));

  return {
    member,
    filters,
    plans: serializedPlans,
    reports: serializedReports,
    completionPct:
      planItemCount === 0
        ? null
        : Math.round((completedCount / planItemCount) * 1000) / 10,
    totalHours,
  };
}
