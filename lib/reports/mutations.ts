import { Prisma } from "@/app/generated/prisma/client";
import { PeriodType, PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  applyPlanItemOutcomesFromReport,
  clearPlanItemOutcomesForReport,
} from "@/lib/plans/complete-items";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { canEditPeriod, getPeriodBounds } from "@/lib/periods";
import {
  deleteAttachmentsForReport,
  deleteAttachmentsForReportEntry,
} from "@/lib/reports/attachments";

export type UnplannedEntryInput = {
  title: string;
  description?: string;
  hours: number;
  visibility: "PUBLIC" | "PRIVATE";
};

export type EntryUpdateInput = {
  description?: string;
  hours: number;
  visibility: "PUBLIC" | "PRIVATE";
};

export async function createReportForPeriod(
  userId: string,
  organizationId: string,
  type: PeriodType,
  referenceDateStr: string,
) {
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDateStr);

  const report = await db.report.upsert({
    where: {
      userId_type_periodStart: {
        userId,
        type,
        periodStart,
      },
    },
    create: {
      userId,
      organizationId,
      type,
      periodStart,
      periodEnd,
    },
    update: {},
  });

  return report;
}

async function touchReportUpdated(reportId: string) {
  await db.report.update({
    where: { id: reportId },
    data: { updatedAt: new Date() },
  });
}

export async function checkOffPlanItem(
  reportId: string,
  planItemId: string,
  userId: string,
  organizationId: string,
) {
  const report = await assertEditableReport(reportId, userId, organizationId);

  const planItem = await db.planItem.findFirst({
    where: {
      id: planItemId,
      plan: {
        userId,
        organizationId,
        type: report.type,
        periodStart: report.periodStart,
        status: SubmissionStatus.SUBMITTED,
      },
    },
    include: {
      taskTitle: { select: { title: true } },
    },
  });

  if (!planItem) {
    throw new Error("Plan item not found on your submitted plan.");
  }

  if (planItem.outcome !== PlanItemOutcome.OPEN) {
    throw new Error("This plan item was already resolved in another report.");
  }

  const existing = await db.reportEntry.findFirst({
    where: { reportId, planItemId },
  });

  if (existing) {
    return existing;
  }

  const maxSort = await db.reportEntry.aggregate({
    where: { reportId },
    _max: { sortOrder: true },
  });

  const entry = await db.reportEntry.create({
    data: {
      reportId,
      planItemId,
      customTitle: getPlanItemTitle(planItem),
      description: planItem.description,
      hours: new Prisma.Decimal(0),
      visibility: planItem.visibility,
      planItemOutcome: PlanItemOutcome.COMPLETED,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  await touchReportUpdated(reportId);
  return entry;
}

export async function uncheckPlanItem(
  reportId: string,
  planItemId: string,
  userId: string,
  organizationId: string,
) {
  await assertEditableReport(reportId, userId, organizationId);

  const entry = await db.reportEntry.findFirst({
    where: { reportId, planItemId },
  });

  if (!entry) {
    return;
  }

  await deleteAttachmentsForReportEntry(
    organizationId,
    reportId,
    entry.id,
  );
  await db.reportEntry.delete({ where: { id: entry.id } });
  await touchReportUpdated(reportId);
}

export async function setPlanItemOutcomeInReport(
  reportId: string,
  planItemId: string,
  outcome: PlanItemOutcome,
  userId: string,
  organizationId: string,
) {
  if (outcome === PlanItemOutcome.OPEN) {
    await uncheckPlanItem(reportId, planItemId, userId, organizationId);
    return null;
  }

  if (outcome === PlanItemOutcome.COMPLETED) {
    return checkOffPlanItem(reportId, planItemId, userId, organizationId);
  }

  const report = await assertEditableReport(reportId, userId, organizationId);

  const planItem = await db.planItem.findFirst({
    where: {
      id: planItemId,
      plan: {
        userId,
        organizationId,
        type: report.type,
        periodStart: report.periodStart,
        status: SubmissionStatus.SUBMITTED,
      },
    },
    include: {
      taskTitle: { select: { title: true } },
    },
  });

  if (!planItem) {
    throw new Error("Plan item not found on your submitted plan.");
  }

  if (planItem.outcome !== PlanItemOutcome.OPEN) {
    throw new Error("This plan item was already resolved in another report.");
  }

  const existing = await db.reportEntry.findFirst({
    where: { reportId, planItemId },
  });

  if (existing) {
    const updated = await db.reportEntry.update({
      where: { id: existing.id },
      data: {
        planItemOutcome: outcome,
        hours: new Prisma.Decimal(0),
      },
    });
    await touchReportUpdated(reportId);
    return updated;
  }

  const maxSort = await db.reportEntry.aggregate({
    where: { reportId },
    _max: { sortOrder: true },
  });

  const entry = await db.reportEntry.create({
    data: {
      reportId,
      planItemId,
      customTitle: getPlanItemTitle(planItem),
      description: planItem.description,
      hours: new Prisma.Decimal(0),
      visibility: planItem.visibility,
      planItemOutcome: outcome,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  await touchReportUpdated(reportId);
  return entry;
}

export async function addUnplannedEntry(
  reportId: string,
  userId: string,
  organizationId: string,
  input: UnplannedEntryInput,
) {
  await assertEditableReport(reportId, userId, organizationId);

  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const maxSort = await db.reportEntry.aggregate({
    where: { reportId },
    _max: { sortOrder: true },
  });

  const entry = await db.reportEntry.create({
    data: {
      reportId,
      customTitle: title,
      description: input.description?.trim() || null,
      hours: new Prisma.Decimal(input.hours),
      visibility: input.visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  await touchReportUpdated(reportId);
  return entry;
}

export async function updateReportEntry(
  entryId: string,
  reportId: string,
  userId: string,
  organizationId: string,
  input: EntryUpdateInput,
) {
  await assertEditableReport(reportId, userId, organizationId);

  const entry = await db.reportEntry.findFirst({
    where: { id: entryId, reportId },
  });

  if (!entry) {
    throw new Error("Report entry not found.");
  }

  const updated = await db.reportEntry.update({
    where: { id: entryId },
    data: {
      description: input.description?.trim() || null,
      hours: new Prisma.Decimal(input.hours),
      visibility: input.visibility,
    },
  });
  await touchReportUpdated(reportId);
  return updated;
}

export async function deleteReportEntry(
  entryId: string,
  reportId: string,
  userId: string,
  organizationId: string,
) {
  await assertEditableReport(reportId, userId, organizationId);

  const entry = await db.reportEntry.findFirst({
    where: { id: entryId, reportId },
  });

  if (!entry) {
    throw new Error("Report entry not found.");
  }

  if (entry.planItemId) {
    throw new Error("Uncheck the plan item to remove this entry.");
  }

  await deleteAttachmentsForReportEntry(
    organizationId,
    reportId,
    entryId,
  );
  await db.reportEntry.delete({ where: { id: entryId } });
  await touchReportUpdated(reportId);
}

export async function submitReport(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const report = await assertEditableReport(reportId, userId, organizationId);

  const entries = await db.reportEntry.findMany({
    where: { reportId },
    select: { id: true, hours: true, planItemId: true, planItemOutcome: true },
  });

  if (entries.length === 0) {
    throw new Error("Add at least one report entry before submitting.");
  }

  for (const entry of entries) {
    const hours = Number(entry.hours);
    const outcome = entry.planItemOutcome ?? PlanItemOutcome.COMPLETED;
    const requiresHours =
      !entry.planItemId || outcome === PlanItemOutcome.COMPLETED;

    if (requiresHours && (!Number.isFinite(hours) || hours <= 0)) {
      throw new Error(
        entry.planItemId
          ? "Completed plan items need hours greater than zero."
          : "Every entry must have hours greater than zero.",
      );
    }
  }

  await applyPlanItemOutcomesFromReport(report.id);

  return db.report.update({
    where: { id: report.id },
    data: {
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function deleteReport(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await clearPlanItemOutcomesForReport(reportId);
  await deleteAttachmentsForReport(organizationId, reportId);
  await db.report.delete({ where: { id: report.id } });
}

async function assertEditableReport(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  if (report.status === SubmissionStatus.SUBMITTED) {
    throw new Error("Submitted reports cannot be edited.");
  }

  if (!canEditPeriod(report.type, report.periodStart, report.periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }

  return report;
}
