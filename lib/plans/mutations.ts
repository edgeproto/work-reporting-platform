import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getPeriodBounds } from "@/lib/periods";
import { upsertTaskTitle, getTaskTitle } from "@/lib/task-titles";

export type PlanItemInput = {
  title?: string;
  taskTitleId?: string;
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

  let taskTitle;
  if (input.taskTitleId) {
    taskTitle = await getTaskTitle(organizationId, input.taskTitleId);
    if (!taskTitle) {
      throw new Error("Task not found.");
    }

    const existing = await db.planItem.findFirst({
      where: { planId: plan.id, taskTitleId: taskTitle.id },
    });
    if (existing) {
      throw new Error("This task is already on the plan.");
    }

    const desc = input.description?.trim() || taskTitle.description;
    if (desc && desc !== taskTitle.description) {
      await db.taskTitle.update({
        where: { id: taskTitle.id },
        data: { description: desc },
      });
    }
  } else if (input.title) {
    taskTitle = await upsertTaskTitle(
      organizationId,
      userId,
      input.title,
      input.description,
    );
  } else {
    throw new Error("Task title is required.");
  }

  const maxSort = await db.planItem.aggregate({
    where: { planId: plan.id },
    _max: { sortOrder: true },
  });

  const description =
    input.description?.trim() ||
    taskTitle.description?.trim() ||
    null;

  return db.planItem.create({
    data: {
      planId: plan.id,
      taskTitleId: taskTitle.id,
      customTitle: null,
      description,
      visibility: input.visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: {
      taskTitle: { select: { id: true, title: true, description: true } },
    },
  });
}

export async function updatePlanItem(
  itemId: string,
  userId: string,
  organizationId: string,
  input: Partial<PlanItemInput>,
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

  const data: {
    description?: string | null;
    visibility?: "PUBLIC" | "PRIVATE";
    taskTitleId?: string;
    customTitle?: string | null;
  } = {};

  if (input.description !== undefined) {
    data.description = input.description.trim() || null;
  }

  if (input.visibility !== undefined) {
    data.visibility = input.visibility;
  }

  if (input.title !== undefined) {
    const taskTitle = await upsertTaskTitle(
      organizationId,
      userId,
      input.title,
      input.description,
    );
    data.taskTitleId = taskTitle.id;
    data.customTitle = null;
  }

  return db.planItem.update({
    where: { id: itemId },
    data,
    include: {
      taskTitle: { select: { id: true, title: true } },
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

  await db.planItem.delete({ where: { id: itemId } });
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
