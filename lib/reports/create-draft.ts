import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";

/**
 * Copy entries from submitted daily reports within the weekly/monthly period
 * into an empty draft report. Mechanical copy — one row per daily entry.
 */
export async function prefillWeeklyMonthlyReportFromDailyEntries(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
  });

  if (
    !report ||
    report.type === PeriodType.DAILY ||
    report.status !== SubmissionStatus.DRAFT
  ) {
    return { prefilledCount: 0 };
  }

  const existingCount = await db.reportEntry.count({ where: { reportId } });
  if (existingCount > 0) {
    return { prefilledCount: 0 };
  }

  const dailyReports = await db.report.findMany({
    where: {
      userId,
      organizationId,
      type: PeriodType.DAILY,
      status: SubmissionStatus.SUBMITTED,
      periodStart: {
        gte: report.periodStart,
        lte: report.periodEnd,
      },
    },
    include: {
      entries: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { periodStart: "asc" },
  });

  const entriesToCreate = dailyReports.flatMap((dailyReport) =>
    dailyReport.entries.map((entry) => ({
      reportId,
      taskTitleId: entry.taskTitleId,
      customTitle: entry.customTitle,
      description: entry.description,
      hours: entry.hours,
      visibility: entry.visibility,
    })),
  );

  if (entriesToCreate.length === 0) {
    return { prefilledCount: 0 };
  }

  await db.reportEntry.createMany({
    data: entriesToCreate.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    })),
  });

  return { prefilledCount: entriesToCreate.length };
}
