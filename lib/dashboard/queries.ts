import "server-only";

import { PeriodType, PlanItemOutcome, Role, SubmissionStatus, Visibility } from "@/app/generated/prisma/enums";
import type { DashboardFilters } from "@/lib/dashboard/filters";
import type {
  FilingTimestamps,
  MemberRosterRow,
  RosterPlanLine,
  RosterReportLine,
} from "@/lib/dashboard/types";
import { db } from "@/lib/db";
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

type Viewer = {
  id: string;
  role: Role;
  organizationId: string;
};

function serializeTimestamps(
  submittedAt: Date | null,
  updatedAt: Date,
): FilingTimestamps {
  return {
    submittedAt: submittedAt?.toISOString() ?? null,
    updatedAt: updatedAt.toISOString(),
  };
}

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

  const ownerFilter = ownerFilterForViewer(viewer);

  const [plans, reports] = await Promise.all([
    db.plan.findMany({
      where: {
        organizationId: viewer.organizationId,
        type: filters.periodType,
        periodStart: filters.periodStart,
        status: SubmissionStatus.SUBMITTED,
        ...ownerFilter,
      },
      include: {
        user: { select: { id: true } },
        items: {
          orderBy: { sortOrder: "asc" },
          include: { taskTitle: { select: { title: true } } },
        },
      },
    }),
    db.report.findMany({
      where: {
        organizationId: viewer.organizationId,
        type: filters.periodType,
        periodStart: filters.periodStart,
        status: SubmissionStatus.SUBMITTED,
        ...ownerFilter,
      },
      include: {
        user: { select: { id: true } },
        entries: {
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
    }),
  ]);

  const planByUser = new Map(plans.map((plan) => [plan.userId, plan]));
  const reportByUser = new Map(reports.map((report) => [report.userId, report]));

  const rows: MemberRosterRow[] = visibleMembers.map((member) => {
    const plan = planByUser.get(member.id);
    const report = reportByUser.get(member.id);
    const canSeePrivate = canViewPrivate(viewer, member.id, viewer.id);

    const planLines: RosterPlanLine[] = (plan?.items ?? [])
      .filter(
        (item) =>
          canSeePrivate || item.visibility === Visibility.PUBLIC,
      )
      .map((item) => ({
        title: getPlanItemTitle(item),
        visibility: item.visibility,
        outcome: item.outcome,
      }));

    const reportLines: RosterReportLine[] = (report?.entries ?? [])
      .filter(
        (entry) =>
          canSeePrivate || entry.visibility === Visibility.PUBLIC,
      )
      .map((entry) => ({
        title: getReportEntryTitle(entry),
        hours: Number(entry.hours) || 0,
        visibility: entry.visibility,
      }));

    const planItemCount = planLines.length;
    const completedCount = planLines.filter(
      (line) => line.outcome === PlanItemOutcome.COMPLETED,
    ).length;
    const hours = reportLines.reduce((sum, line) => sum + line.hours, 0);

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
      planLines,
      reportLines,
      planTimestamps: plan
        ? serializeTimestamps(plan.submittedAt, plan.updatedAt)
        : null,
      reportTimestamps: report
        ? serializeTimestamps(report.submittedAt, report.updatedAt)
        : null,
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
  plan: {
    id: string;
    type: PeriodType;
    periodStart: Date;
    periodEnd: Date;
    submittedAt: Date | null;
    updatedAt: Date;
    items: Array<{
      id: string;
      title: string;
      description: string | null;
      visibility: Visibility;
      outcome: PlanItemOutcome;
    }>;
  } | null;
  report: {
    id: string;
    type: PeriodType;
    periodStart: Date;
    periodEnd: Date;
    submittedAt: Date | null;
    updatedAt: Date;
    entries: Array<{
      id: string;
      title: string;
      description: string | null;
      hours: number;
      visibility: Visibility;
    }>;
  } | null;
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

  const [plan, report] = await Promise.all([
    db.plan.findFirst({
      where: {
        userId: member.id,
        organizationId: viewer.organizationId,
        type: filters.periodType,
        periodStart: filters.periodStart,
        status: SubmissionStatus.SUBMITTED,
      },
      include: {
        items: {
          where: canSeePrivate ? undefined : { visibility: Visibility.PUBLIC },
          orderBy: { sortOrder: "asc" },
          include: { taskTitle: { select: { title: true } } },
        },
      },
    }),
    db.report.findFirst({
      where: {
        userId: member.id,
        organizationId: viewer.organizationId,
        type: filters.periodType,
        periodStart: filters.periodStart,
        status: SubmissionStatus.SUBMITTED,
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
    }),
  ]);

  const planItems = plan?.items ?? [];
  const reportEntries = report?.entries ?? [];
  const completedCount = planItems.filter(
    (item) => item.outcome === PlanItemOutcome.COMPLETED,
  ).length;
  const totalHours = reportEntries.reduce(
    (sum, entry) => sum + (Number(entry.hours) || 0),
    0,
  );

  return {
    member,
    filters,
    plan: plan
      ? {
          id: plan.id,
          type: plan.type,
          periodStart: plan.periodStart,
          periodEnd: plan.periodEnd,
          submittedAt: plan.submittedAt,
          updatedAt: plan.updatedAt,
          items: planItems.map((item) => ({
            id: item.id,
            title: getPlanItemTitle(item),
            description: item.description,
            visibility: item.visibility,
            outcome: item.outcome,
          })),
        }
      : null,
    report: report
      ? {
          id: report.id,
          type: report.type,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          submittedAt: report.submittedAt,
          updatedAt: report.updatedAt,
          entries: reportEntries.map((entry) => ({
            id: entry.id,
            title: getReportEntryTitle(entry),
            description: entry.description,
            hours: Number(entry.hours) || 0,
            visibility: entry.visibility,
          })),
        }
      : null,
    completionPct:
      planItems.length === 0
        ? null
        : Math.round((completedCount / planItems.length) * 1000) / 10,
    totalHours,
  };
}
