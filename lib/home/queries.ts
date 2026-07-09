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
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
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
    itemPreviews: Array<{ id: string; title: string }>;
  } | null;
  report: {
    id: string;
    status: FilingStatus;
    entryCount: number;
    totalHours: number;
    entryPreviews: Array<{ id: string; title: string }>;
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
  locale: Locale,
): Promise<HomePeriodSectionData> {
  const dict = getDictionary(locale);
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
    periodLabel: formatPeriodLabel(
      type,
      periodStart,
      periodEnd,
      undefined,
      locale,
      dict.periods,
    ),
    editable,
    plan: plan
      ? {
          id: plan.id,
          status: toFilingStatus(plan.status),
          itemCount: plan.items.length,
          completedCount: plan.items.filter(
            (item) => item.outcome === PlanItemOutcome.COMPLETED,
          ).length,
          itemPreviews: plan.items.slice(0, 3).map((item) => ({
            id: item.id,
            title: getPlanItemTitle(item),
          })),
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
          entryPreviews: report.entries.slice(0, 3).map((entry) => ({
            id: entry.id,
            title: getReportEntryTitle(entry),
          })),
        }
      : null,
  };
}

export async function loadHomeHubData(
  userId: string,
  organizationId: string,
  prefs: HomePeriodPrefs,
  locale: Locale = "en",
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
      locale,
    ),
    loadSection(
      userId,
      organizationId,
      PeriodType.WEEKLY,
      referenceForType(PeriodType.WEEKLY, prefs),
      locale,
    ),
    loadSection(
      userId,
      organizationId,
      PeriodType.DAILY,
      referenceForType(PeriodType.DAILY, prefs),
      locale,
    ),
  ]);

  return { monthly, weekly, daily };
}
