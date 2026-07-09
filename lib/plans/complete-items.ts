import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";

/** Apply plan-item outcomes when a report is submitted. */
export async function applyPlanItemOutcomesFromReport(reportId: string) {
  const entries = await db.reportEntry.findMany({
    where: {
      reportId,
      planItemId: { not: null },
    },
    select: { planItemId: true, planItemOutcome: true },
  });

  if (entries.length === 0) {
    return;
  }

  const now = new Date();

  await Promise.all(
    entries.map((entry) => {
      if (!entry.planItemId) {
        return Promise.resolve();
      }

      const outcome = entry.planItemOutcome ?? PlanItemOutcome.COMPLETED;

      return db.planItem.updateMany({
        where: {
          id: entry.planItemId,
          outcome: PlanItemOutcome.OPEN,
        },
        data: {
          outcome,
          completedAt: now,
          completedInReportId: reportId,
        },
      });
    }),
  );
}

/** Clear plan-item outcomes when a submitted report is deleted. */
export async function clearPlanItemOutcomesForReport(reportId: string) {
  await db.planItem.updateMany({
    where: { completedInReportId: reportId },
    data: {
      outcome: PlanItemOutcome.OPEN,
      completedAt: null,
      completedInReportId: null,
    },
  });
}
