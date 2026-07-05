import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getPeriodBounds } from "@/lib/periods";

export type PlanItemInput = {
  title?: string;
  parentTaskId?: string;
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
    include: { plan: true, task: true },
  });

  if (!item) {
    throw new Error("Plan item not found.");
  }

  if (item.plan.status === SubmissionStatus.SUBMITTED) {
    throw new Error("Submitted plans cannot be edited.");
  }

  if (item.taskId) {
    await db.task.delete({ where: { id: item.taskId } });
  } else {
    await db.planItem.delete({ where: { id: itemId } });
  }
}

export async function submitPlan(
  planId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await assertEditablePlan(planId, userId, organizationId);

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

  return plan;
}
