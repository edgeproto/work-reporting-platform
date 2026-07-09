import { PeriodType, PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import { getPlanForPeriod } from "@/lib/plans/queries";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import {
  canEditPeriod,
  formatPeriodLabel,
  getPeriodBounds,
  monthInputToReferenceDate,
} from "@/lib/periods";
import { db } from "@/lib/db";
import type { HomePeriodPrefs } from "@/lib/home/prefs";

export type FilingStatus = "missing" | "draft" | "submitted";

export type HomePeriodSectionData = {
  type: PeriodType;
  referenceDate: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  editable: boolean;
  plan: {
    id: string;
    status: FilingStatus;
    itemCount: number;
    completedCount: number;
    itemTitles: string[];
  } | null;
  report: {
    id: string;
    status: FilingStatus;
    entryCount: number;
    totalHours: number;
    entryTitles: string[];
  } | null;
};

function referenceForType(type: PeriodType, prefs: HomePeriodPrefs): string {
  switch (type) {
    case PeriodType.MONTHLY:
      return monthInputToReferenceDate(prefs.month);
    case PeriodType.WEEKLY:
      return prefs.weekSunday;
    case PeriodType.DAILY:
      return prefs.day;
    default:
      return prefs.day;
  }
}

function toFilingStatus(status: SubmissionStatus | undefined): FilingStatus {
  if (!status) {
    return "missing";
  }
  return status === SubmissionStatus.SUBMITTED ? "submitted" : "draft";
}

async function loadSection(
  userId: string,
  organizationId: string,
  type: PeriodType,
  referenceDate: string,
): Promise<HomePeriodSectionData> {
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDate);
  const editable = canEditPeriod(type, periodStart, periodEnd);

  const [plan, report] = await Promise.all([
    getPlanForPeriod(userId, organizationId, type, periodStart),
    db.report.findUnique({
      where: {
        userId_type_periodStart: {
          userId,
          type,
          periodStart,
        },
      },
      include: {
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

  return {
    type,
    referenceDate,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    periodLabel: formatPeriodLabel(type, periodStart, periodEnd),
    editable,
    plan: plan
      ? {
          id: plan.id,
          status: toFilingStatus(plan.status),
          itemCount: plan.items.length,
          completedCount: plan.items.filter(
            (item) => item.outcome === PlanItemOutcome.COMPLETED,
          ).length,
          itemTitles: plan.items.slice(0, 3).map((item) => getPlanItemTitle(item)),
        }
      : null,
    report: report
      ? {
          id: report.id,
          status: toFilingStatus(report.status),
          entryCount: report.entries.length,
          totalHours: report.entries.reduce(
            (sum, entry) => sum + (Number(entry.hours) || 0),
            0,
          ),
          entryTitles: report.entries
            .slice(0, 3)
            .map((entry) => getReportEntryTitle(entry)),
        }
      : null,
  };
}

export async function loadHomeHubData(
  userId: string,
  organizationId: string,
  prefs: HomePeriodPrefs,
): Promise<{
  monthly: HomePeriodSectionData;
  weekly: HomePeriodSectionData;
  daily: HomePeriodSectionData;
}> {
  const [monthly, weekly, daily] = await Promise.all([
    loadSection(
      userId,
      organizationId,
      PeriodType.MONTHLY,
      referenceForType(PeriodType.MONTHLY, prefs),
    ),
    loadSection(
      userId,
      organizationId,
      PeriodType.WEEKLY,
      referenceForType(PeriodType.WEEKLY, prefs),
    ),
    loadSection(
      userId,
      organizationId,
      PeriodType.DAILY,
      referenceForType(PeriodType.DAILY, prefs),
    ),
  ]);

  return { monthly, weekly, daily };
}
