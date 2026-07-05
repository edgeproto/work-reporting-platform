import { db } from "@/lib/db";

/** Mark plan items as completed when a report is submitted. */
export async function completePlanItemsFromReport(reportId: string) {
  const entries = await db.reportEntry.findMany({
    where: {
      reportId,
      planItemId: { not: null },
    },
    select: { planItemId: true },
  });

  const planItemIds = entries
    .map((entry) => entry.planItemId)
    .filter((id): id is string => id !== null);

  if (planItemIds.length === 0) {
    return;
  }

  const now = new Date();

  await db.planItem.updateMany({
    where: {
      id: { in: planItemIds },
      completedAt: null,
    },
    data: {
      completedAt: now,
      completedInReportId: reportId,
    },
  });
}

/** Clear plan-item completion when a submitted report is deleted. */
export async function clearPlanItemCompletionForReport(reportId: string) {
  await db.planItem.updateMany({
    where: { completedInReportId: reportId },
    data: {
      completedAt: null,
      completedInReportId: null,
    },
  });
}
