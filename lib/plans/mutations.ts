import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { canEditPeriod, getPeriodBounds } from "@/lib/periods";
import { deleteAttachmentsForPlanItem } from "@/lib/reports/attachments";

export type PlanItemInput = {
  title: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE";
};

export async function createPlanForPeriod(
  userId: string,
  organizationId: string,
  type: PeriodType,
  referenceDateStr: string,
) {
  const { periodStart, periodEnd } = getPeriodBounds(type, referenceDateStr);

  return db.plan.upsert({
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

export async function updateContinuousNotes(
  planId: string,
  userId: string,
  organizationId: string,
  continuousNotes: string,
) {
  const plan = await assertEditablePlan(planId, userId, organizationId);

  return db.plan.update({
    where: { id: plan.id },
    data: { continuousNotes },
  });
}

export async function addPlanItem(
  planId: string,
  userId: string,
  organizationId: string,
  input: PlanItemInput,
) {
  const plan = await assertEditablePlan(planId, userId, organizationId);

  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const maxSort = await db.planItem.aggregate({
    where: { planId: plan.id },
    _max: { sortOrder: true },
  });

  return db.planItem.create({
    data: {
      planId: plan.id,
      customTitle: title,
      description: input.description?.trim() || null,
      visibility: input.visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function deletePlanItem(
  itemId: string,
  userId: string,
  organizationId: string,
) {
  const item = await db.planItem.findFirst({
    where: {
      id: itemId,
      plan: { userId, organizationId },
    },
    include: { plan: true },
  });

  if (!item) {
    throw new Error("Plan item not found.");
  }

  if (item.plan.status === SubmissionStatus.SUBMITTED) {
    throw new Error("Submitted plans cannot be edited.");
  }

  if (!canEditPeriod(item.plan.type, item.plan.periodStart, item.plan.periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }

  await deleteAttachmentsForPlanItem(itemId);
  await db.planItem.delete({ where: { id: itemId } });
}

export async function submitPlan(
  planId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await assertEditablePlan(planId, userId, organizationId);

  const itemCount = await db.planItem.count({
    where: { planId: plan.id },
  });

  if (itemCount === 0) {
    throw new Error("Add at least one plan item before submitting.");
  }

  return db.plan.update({
    where: { id: plan.id },
    data: {
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });
}

export async function reopenPlan(
  planId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await db.plan.findFirst({
    where: { id: planId, userId, organizationId },
  });

  if (!plan) {
    throw new Error("Plan not found.");
  }

  if (plan.status !== SubmissionStatus.SUBMITTED) {
    throw new Error("Only submitted plans can be reopened.");
  }

  if (!canEditPeriod(plan.type, plan.periodStart, plan.periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }

  return db.plan.update({
    where: { id: plan.id },
    data: {
      status: SubmissionStatus.DRAFT,
      submittedAt: null,
    },
  });
}

export async function deletePlan(
  planId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await db.plan.findFirst({
    where: { id: planId, userId, organizationId },
  });

  if (!plan) {
    throw new Error("Plan not found.");
  }

  await db.plan.delete({ where: { id: plan.id } });
}

async function assertEditablePlan(
  planId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await db.plan.findFirst({
    where: { id: planId, userId, organizationId },
  });

  if (!plan) {
    throw new Error("Plan not found.");
  }

  if (plan.status === SubmissionStatus.SUBMITTED) {
    throw new Error("Submitted plans cannot be edited.");
  }

  if (!canEditPeriod(plan.type, plan.periodStart, plan.periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }

  return plan;
}
