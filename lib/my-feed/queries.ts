import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/locales";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { isPlanItemCompleted } from "@/lib/plans/outcome";
import type {
  FeedPeriodCard,
  FeedPlanFiling,
  FeedReportFiling,
  MyFeedData,
} from "@/lib/my-feed/types";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import {
  addDays,
  formatDateInTz,
  formatPeriodLabel,
  getPeriodBounds,
} from "@/lib/periods";

function lastDailyReferences(count: number): string[] {
  const today = formatDateInTz(new Date());
  const dates: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    dates.push(addDays(today, -offset));
  }

  return dates;
}

function lastWeeklyReferences(count: number): string[] {
  const today = formatDateInTz(new Date());
  const { periodStart } = getPeriodBounds(PeriodType.WEEKLY, today);
  let sunday = formatDateInTz(periodStart);
  const weeks: string[] = [sunday];

  for (let index = 1; index < count; index += 1) {
    sunday = addDays(sunday, -7);
    weeks.unshift(sunday);
  }

  return weeks;
}

function dailyHeading(
  referenceDate: string,
  locale: Locale,
): string {
  const dict = getDictionary(locale);
  const today = formatDateInTz(new Date());
  const yesterday = addDays(today, -1);

  if (referenceDate === today) {
    return dict.periods.relative.today;
  }
  if (referenceDate === yesterday) {
    return dict.periods.relative.yesterday;
  }

  return formatPeriodLabel(
    PeriodType.DAILY,
    getPeriodBounds(PeriodType.DAILY, referenceDate).periodStart,
    getPeriodBounds(PeriodType.DAILY, referenceDate).periodEnd,
    undefined,
    locale,
    dict.periods,
  );
}

function weeklyHeading(referenceDate: string, locale: Locale): string {
  const dict = getDictionary(locale);
  const today = formatDateInTz(new Date());
  const currentWeekStart = formatDateInTz(
    getPeriodBounds(PeriodType.WEEKLY, today).periodStart,
  );

  if (referenceDate === currentWeekStart) {
    return dict.periods.relative.thisWeek;
  }

  const { periodStart, periodEnd } = getPeriodBounds(
    PeriodType.WEEKLY,
    referenceDate,
  );

  return formatPeriodLabel(
    PeriodType.WEEKLY,
    periodStart,
    periodEnd,
    undefined,
    locale,
    dict.periods,
  );
}

async function loadFeedCard(
  userId: string,
  organizationId: string,
  type: PeriodType,
  referenceDate: string,
  locale: Locale,
): Promise<FeedPeriodCard> {
  const dict = getDictionary(locale);
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDate);
  const periodLabel = formatPeriodLabel(
    type,
    periodStart,
    periodEnd,
    undefined,
    locale,
    dict.periods,
  );
  const heading =
    type === PeriodType.DAILY
      ? dailyHeading(referenceDate, locale)
      : weeklyHeading(referenceDate, locale);

  const [plan, report] = await Promise.all([
    db.plan.findUnique({
      where: {
        userId_type_periodStart: {
          userId,
          type,
          periodStart,
        },
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    }),
    db.report.findUnique({
      where: {
        userId_type_periodStart: {
          userId,
          type,
          periodStart,
        },
      },
      include: {
        entries: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  let planFiling: FeedPlanFiling | null = null;
  if (plan) {
    const lines = plan.items.map((item) => ({
      title: getPlanItemTitle(item),
      visibility: item.visibility,
      outcome: item.outcome,
    }));
    planFiling = {
      id: plan.id,
      status:
        plan.status === SubmissionStatus.SUBMITTED ? "submitted" : "draft",
      lines,
      completedCount: plan.items.filter((item) =>
        isPlanItemCompleted(item.outcome),
      ).length,
    };
  }

  let reportFiling: FeedReportFiling | null = null;
  if (report) {
    const lines = report.entries.map((entry) => ({
      title: getReportEntryTitle(entry),
      hours: Number(entry.hours) || 0,
      visibility: entry.visibility,
    }));
    reportFiling = {
      id: report.id,
      status:
        report.status === SubmissionStatus.SUBMITTED ? "submitted" : "draft",
      lines,
      totalHours: lines.reduce((sum, line) => sum + line.hours, 0),
    };
  }

  return {
    type,
    referenceDate,
    periodLabel,
    heading,
    plan: planFiling,
    report: reportFiling,
  };
}

export async function loadMyFeedData(
  userId: string,
  organizationId: string,
  locale: Locale = "en",
): Promise<MyFeedData> {
  const [daily, weekly] = await Promise.all([
    Promise.all(
      lastDailyReferences(7).map((referenceDate) =>
        loadFeedCard(
          userId,
          organizationId,
          PeriodType.DAILY,
          referenceDate,
          locale,
        ),
      ),
    ),
    Promise.all(
      lastWeeklyReferences(5).map((referenceDate) =>
        loadFeedCard(
          userId,
          organizationId,
          PeriodType.WEEKLY,
          referenceDate,
          locale,
        ),
      ),
    ),
  ]);

  return { daily, weekly };
}

export type { FeedPeriodCard, MyFeedData } from "@/lib/my-feed/types";
