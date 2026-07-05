import {
  PeriodType,
  Role,
  SubmissionStatus,
  Visibility,
} from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import { isManagerOrAbove } from "@/lib/rbac";
import { canViewPrivate, visibilityWhereForViewer } from "@/lib/visibility";

import type { TeamFilters } from "./filters";

type Viewer = {
  id: string;
  role: Role;
  organizationId: string;
};

function periodDateFilter(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) {
    return {};
  }

  return {
    periodStart: {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    },
  };
}

function memberFilter(
  viewer: Viewer,
  memberId?: string,
  excludeSelfForMembers = false,
) {
  if (memberId) {
    return { userId: memberId };
  }

  if (excludeSelfForMembers && !isManagerOrAbove(viewer)) {
    return { userId: { not: viewer.id } };
  }

  return {};
}

export async function listOrgMembers(organizationId: string) {
  return db.user.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: [{ name: "asc" }],
  });
}

export async function listOrgTaskTitles(organizationId: string) {
  return db.taskTitle.findMany({
    where: { organizationId },
    select: { id: true, title: true },
    orderBy: [{ title: "asc" }],
  });
}

const reportEntryInclude = {
  task: { select: { title: true } },
  taskTitle: { select: { id: true, title: true } },
  planItem: {
    select: {
      task: { select: { title: true } },
      taskTitle: { select: { title: true } },
      customTitle: true,
    },
  },
  report: {
    select: {
      id: true,
      type: true,
      periodStart: true,
      periodEnd: true,
      submittedAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
} as const;

const planItemInclude = {
  task: { select: { title: true } },
  taskTitle: { select: { id: true, title: true } },
  plan: {
    select: {
      id: true,
      type: true,
      periodStart: true,
      periodEnd: true,
      submittedAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
    },
  },
} as const;

export type TeamReportEntry = Awaited<
  ReturnType<typeof listTeamReportEntries>
>[number];

export type TeamPlanItem = Awaited<ReturnType<typeof listTeamPlanItems>>[number];

export async function listTeamReportEntries(viewer: Viewer, filters: TeamFilters) {
  const managerView = isManagerOrAbove(viewer);
  const visibilityFilter = managerView ? filters.visibility : undefined;

  return db.reportEntry.findMany({
    where: {
      ...(filters.taskTitleId ? { taskTitleId: filters.taskTitleId } : {}),
      ...(!managerView ? { visibility: Visibility.PUBLIC } : {}),
      ...(managerView && visibilityFilter
        ? { visibility: visibilityFilter }
        : {}),
      report: {
        organizationId: viewer.organizationId,
        status: SubmissionStatus.SUBMITTED,
        ...(filters.periodType ? { type: filters.periodType } : {}),
        ...periodDateFilter(filters.dateFrom, filters.dateTo),
        ...memberFilter(viewer, filters.memberId, true),
      },
    },
    include: reportEntryInclude,
    orderBy: [
      { report: { periodStart: "desc" } },
      { report: { submittedAt: "desc" } },
      { sortOrder: "asc" },
    ],
  });
}

export async function listTeamPlanItems(viewer: Viewer, filters: TeamFilters) {
  const managerView = isManagerOrAbove(viewer);
  const visibilityFilter = managerView ? filters.visibility : undefined;

  return db.planItem.findMany({
    where: {
      ...(filters.taskTitleId ? { taskTitleId: filters.taskTitleId } : {}),
      ...(!managerView ? { visibility: Visibility.PUBLIC } : {}),
      ...(managerView && visibilityFilter
        ? { visibility: visibilityFilter }
        : {}),
      plan: {
        organizationId: viewer.organizationId,
        status: SubmissionStatus.SUBMITTED,
        ...(filters.periodType ? { type: filters.periodType } : {}),
        ...periodDateFilter(filters.dateFrom, filters.dateTo),
        ...memberFilter(viewer, filters.memberId, true),
      },
    },
    include: planItemInclude,
    orderBy: [
      { plan: { periodStart: "desc" } },
      { plan: { submittedAt: "desc" } },
      { sortOrder: "asc" },
    ],
  });
}

export type TeamTimelineItem =
  | {
      kind: "report";
      id: string;
      title: string;
      description: string | null;
      hours: number;
      visibility: Visibility;
      periodType: PeriodType;
      periodStart: Date;
      periodEnd: Date;
      submittedAt: Date | null;
      ownerId: string;
      ownerName: string;
      parentId: string;
      sortOrder: number;
    }
  | {
      kind: "plan";
      id: string;
      title: string;
      description: string | null;
      visibility: Visibility;
      periodType: PeriodType;
      periodStart: Date;
      periodEnd: Date;
      submittedAt: Date | null;
      ownerId: string;
      ownerName: string;
      parentId: string;
      completed: boolean;
      sortOrder: number;
    };

export function buildTeamTimeline(
  entries: TeamReportEntry[],
  planItems: TeamPlanItem[],
  view: TeamFilters["view"],
): TeamTimelineItem[] {
  const items: TeamTimelineItem[] = [];

  if (view === "all" || view === "reports") {
    for (const entry of entries) {
      items.push({
        kind: "report",
        id: entry.id,
        title: getReportEntryTitle(entry),
        description: entry.description,
        hours: Number(entry.hours) || 0,
        visibility: entry.visibility,
        periodType: entry.report.type,
        periodStart: entry.report.periodStart,
        periodEnd: entry.report.periodEnd,
        submittedAt: entry.report.submittedAt,
        ownerId: entry.report.userId,
        ownerName: entry.report.user.name,
        parentId: entry.report.id,
        sortOrder: entry.sortOrder,
      });
    }
  }

  if (view === "all" || view === "plans") {
    for (const item of planItems) {
      items.push({
        kind: "plan",
        id: item.id,
        title: getPlanItemTitle(item),
        description: item.description,
        visibility: item.visibility,
        periodType: item.plan.type,
        periodStart: item.plan.periodStart,
        periodEnd: item.plan.periodEnd,
        submittedAt: item.plan.submittedAt,
        ownerId: item.plan.userId,
        ownerName: item.plan.user.name,
        parentId: item.plan.id,
        completed: item.completedAt != null,
        sortOrder: item.sortOrder,
      });
    }
  }

  items.sort((a, b) => {
    const periodDiff = b.periodStart.getTime() - a.periodStart.getTime();
    if (periodDiff !== 0) {
      return periodDiff;
    }

    const submittedA = a.submittedAt?.getTime() ?? 0;
    const submittedB = b.submittedAt?.getTime() ?? 0;
    if (submittedB !== submittedA) {
      return submittedB - submittedA;
    }

    if (a.kind !== b.kind) {
      return a.kind === "report" ? -1 : 1;
    }

    return a.sortOrder - b.sortOrder;
  });

  return items;
}

export async function fetchTeamViewData(viewer: Viewer, filters: TeamFilters) {
  const [members, taskTitles, reportEntries, planItems] = await Promise.all([
    listOrgMembers(viewer.organizationId),
    listOrgTaskTitles(viewer.organizationId),
    filters.view === "plans"
      ? Promise.resolve([])
      : listTeamReportEntries(viewer, filters),
    filters.view === "reports"
      ? Promise.resolve([])
      : listTeamPlanItems(viewer, filters),
  ]);

  const timeline = buildTeamTimeline(reportEntries, planItems, filters.view);

  return {
    members,
    taskTitles,
    reportEntries,
    planItems,
    timeline,
    managerView: isManagerOrAbove(viewer),
  };
}

/** Re-export for callers that need per-owner visibility checks. */
export { canViewPrivate, visibilityWhereForViewer };
