import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { deleteAttachmentsForReportEntry } from "@/lib/reports/attachments";

function entryCopyKey(entry: {
  taskTitleId: string | null;
  customTitle: string | null;
  description: string | null;
  hours: { toString(): string } | number | string;
  visibility: string;
}): string {
  const hours = Number(entry.hours).toFixed(2);
  return [
    entry.taskTitleId ?? "",
    entry.customTitle ?? "",
    entry.description ?? "",
    hours,
    entry.visibility,
  ].join("\0");
}

/**
 * Remove report entries that were mechanically copied from submitted daily
 * reports (legacy prefill). Only touches unplanned entries on weekly/monthly
 * drafts that exactly match a daily entry in the same period.
 */
export async function removeMechanicallyCopiedDailyEntries(
  reportId: string,
  userId: string,
  organizationId: string,
): Promise<{ removedCount: number }> {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
  });

  if (
    !report ||
    report.type === PeriodType.DAILY ||
    report.status !== SubmissionStatus.DRAFT
  ) {
    return { removedCount: 0 };
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
      entries: true,
    },
  });

  const copiedKeys = new Set(
    dailyReports.flatMap((dailyReport) =>
      dailyReport.entries.map((entry) => entryCopyKey(entry)),
    ),
  );

  if (copiedKeys.size === 0) {
    return { removedCount: 0 };
  }

  const draftEntries = await db.reportEntry.findMany({
    where: {
      reportId,
      planItemId: null,
    },
  });

  const entriesToRemove = draftEntries.filter((entry) =>
    copiedKeys.has(entryCopyKey(entry)),
  );

  if (entriesToRemove.length === 0) {
    return { removedCount: 0 };
  }

  for (const entry of entriesToRemove) {
    await deleteAttachmentsForReportEntry(
      organizationId,
      reportId,
      entry.id,
    );
    await db.reportEntry.delete({ where: { id: entry.id } });
  }

  await db.report.update({
    where: { id: reportId },
    data: { updatedAt: new Date() },
  });

  return { removedCount: entriesToRemove.length };
}
