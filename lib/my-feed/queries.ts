import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { isPlanItemCompleted } from "@/lib/plans/outcome";
import {
  addDays,
  formatDateInTz,
  formatPeriodLabel,
  getPeriodBounds,
} from "@/lib/periods";

export type FeedFiling = {
  id: string;
  status: "draft" | "submitted";
  summary: string;
};

export type FeedPeriodCard = {
  type: PeriodType;
  referenceDate: string;
  periodLabel: string;
  heading: string;
  plan: FeedFiling | null;
  report: FeedFiling | null;
};

export type MyFeedData = {
  daily: FeedPeriodCard[];
  weekly: FeedPeriodCard[];
};

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

function dailyHeading(referenceDate: string): string {
  const today = formatDateInTz(new Date());
  const yesterday = addDays(today, -1);

  if (referenceDate === today) {
    return "Today";
  }
  if (referenceDate === yesterday) {
    return "Yesterday";
  }

  return formatPeriodLabel(
    PeriodType.DAILY,
    getPeriodBounds(PeriodType.DAILY, referenceDate).periodStart,
    getPeriodBounds(PeriodType.DAILY, referenceDate).periodEnd,
  );
}

function weeklyHeading(referenceDate: string): string {
  const today = formatDateInTz(new Date());
  const currentWeekStart = formatDateInTz(
    getPeriodBounds(PeriodType.WEEKLY, today).periodStart,
  );

  if (referenceDate === currentWeekStart) {
    return "This week";
  }

  const { periodStart, periodEnd } = getPeriodBounds(
    PeriodType.WEEKLY,
    referenceDate,
  );

  return formatPeriodLabel(PeriodType.WEEKLY, periodStart, periodEnd);
}

async function loadFeedCard(
  userId: string,
  organizationId: string,
  type: PeriodType,
  referenceDate: string,
): Promise<FeedPeriodCard> {
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDate);
  const periodLabel = formatPeriodLabel(type, periodStart, periodEnd);
  const heading =
    type === PeriodType.DAILY
      ? dailyHeading(referenceDate)
      : weeklyHeading(referenceDate);

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

  return {
    type,
    referenceDate,
    periodLabel,
    heading,
    plan: plan
      ? {
          id: plan.id,
          status:
            plan.status === SubmissionStatus.SUBMITTED ? "submitted" : "draft",
          summary:
            plan.items.length === 0
              ? "No items"
              : `${plan.items.filter((item) => isPlanItemCompleted(item.outcome)).length}/${plan.items.length} completed · ${plan.items
                  .slice(0, 2)
                  .map((item) => getPlanItemTitle(item))
                  .join(", ")}${plan.items.length > 2 ? "…" : ""}`,
        }
      : null,
    report: report
      ? {
          id: report.id,
          status:
            report.status === SubmissionStatus.SUBMITTED
              ? "submitted"
              : "draft",
          summary:
            report.entries.length === 0
              ? "No entries"
              : `${report.entries.length} entries · ${report.entries
                  .reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0)
                  .toFixed(1)} h`,
        }
      : null,
  };
}

export async function loadMyFeedData(
  userId: string,
  organizationId: string,
): Promise<MyFeedData> {
  const [daily, weekly] = await Promise.all([
    Promise.all(
      lastDailyReferences(7).map((referenceDate) =>
        loadFeedCard(userId, organizationId, PeriodType.DAILY, referenceDate),
      ),
    ),
    Promise.all(
      lastWeeklyReferences(4).map((referenceDate) =>
        loadFeedCard(userId, organizationId, PeriodType.WEEKLY, referenceDate),
      ),
    ),
  ]);

  return { daily, weekly };
}
