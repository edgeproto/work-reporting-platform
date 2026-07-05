import { Prisma } from "@/app/generated/prisma/client";
import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import {
  clearPlanItemCompletionForReport,
  completePlanItemsFromReport,
} from "@/lib/plans/complete-items";
import { getPeriodBounds } from "@/lib/periods";
import { upsertTaskTitle } from "@/lib/task-titles";

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

  return db.report.upsert({
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
      task: { select: { title: true } },
      taskTitle: { select: { title: true } },
    },
  });

  if (!planItem) {
    throw new Error("Plan item not found on your submitted plan.");
  }

  if (planItem.completedAt) {
    throw new Error("This plan item was already completed in another report.");
  }

  const existing = await db.reportEntry.findFirst({
    where: { reportId, planItemId },
  });

  if (existing) {
    return existing;
  }

  const title = getPlanItemTitle(planItem);
  const taskTitle = await upsertTaskTitle(
    organizationId,
    userId,
    title,
    planItem.description,
  );

  const maxSort = await db.reportEntry.aggregate({
    where: { reportId },
    _max: { sortOrder: true },
  });

  return db.reportEntry.create({
    data: {
      reportId,
      planItemId,
      taskTitleId: taskTitle.id,
      description: planItem.description,
      hours: new Prisma.Decimal(0),
      visibility: planItem.visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
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

  await db.reportEntry.delete({ where: { id: entry.id } });
}

export async function addUnplannedEntry(
  reportId: string,
  userId: string,
  organizationId: string,
  input: UnplannedEntryInput,
) {
  await assertEditableReport(reportId, userId, organizationId);

  const taskTitle = await upsertTaskTitle(
    organizationId,
    userId,
    input.title,
    input.description,
  );

  const maxSort = await db.reportEntry.aggregate({
    where: { reportId },
    _max: { sortOrder: true },
  });

  return db.reportEntry.create({
    data: {
      reportId,
      taskTitleId: taskTitle.id,
      description: input.description?.trim() || null,
      hours: new Prisma.Decimal(input.hours),
      visibility: input.visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
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

  return db.reportEntry.update({
    where: { id: entryId },
    data: {
      description: input.description?.trim() || null,
      hours: new Prisma.Decimal(input.hours),
      visibility: input.visibility,
    },
  });
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

  await db.reportEntry.delete({ where: { id: entryId } });
}

export async function submitReport(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const report = await assertEditableReport(reportId, userId, organizationId);

  const entries = await db.reportEntry.findMany({
    where: { reportId },
    select: { id: true, hours: true },
  });

  if (entries.length === 0) {
    throw new Error("Add at least one report entry before submitting.");
  }

  for (const entry of entries) {
    const hours = Number(entry.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      throw new Error("Every entry must have hours greater than zero.");
    }
  }

  await completePlanItemsFromReport(report.id);

  return db.report.update({
    where: { id: report.id },
    data: {
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
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

  await clearPlanItemCompletionForReport(reportId);
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

  return report;
}
