import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { getMonthBoundsForDate, isPeriodPast, formatDateInTz } from "@/lib/periods";
import { getTaskForUser } from "@/lib/tasks/queries";

export type NewPeriodTaskInput = {
  title: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE";
};

export type FromParentTaskInput = {
  parentTaskId: string;
  visibility: "PUBLIC" | "PRIVATE";
};

export async function createMonthlyTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  input: NewPeriodTaskInput,
) {
  return createStandaloneTaskForPlan(
    planId,
    userId,
    organizationId,
    PeriodType.MONTHLY,
    input,
  );
}

export async function createWeeklyTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  input: NewPeriodTaskInput,
) {
  return createStandaloneTaskForPlan(
    planId,
    userId,
    organizationId,
    PeriodType.WEEKLY,
    input,
  );
}

export async function createDailyTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  input: NewPeriodTaskInput,
) {
  return createStandaloneTaskForPlan(
    planId,
    userId,
    organizationId,
    PeriodType.DAILY,
    input,
  );
}

async function createStandaloneTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  type: PeriodType,
  input: NewPeriodTaskInput,
) {
  const plan = await assertPlanForTaskAdd(planId, userId, organizationId);

  if (plan.type !== type) {
    throw new Error(`Task type does not match the ${type.toLowerCase()} plan.`);
  }

  if (isPeriodPast(plan.periodEnd)) {
    throw new Error(`Cannot add tasks — this ${type.toLowerCase()} period has passed.`);
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("Task title is required.");
  }

  const description = input.description?.trim() || null;

  const task = await db.task.create({
    data: {
      userId,
      organizationId,
      type,
      title,
      description,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
    },
  });

  return createPlanItemForTask(plan.id, task.id, title, description, input.visibility);
}

export async function createWeeklySubTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  input: FromParentTaskInput,
) {
  const plan = await assertPlanForTaskAdd(planId, userId, organizationId);

  if (plan.type !== PeriodType.WEEKLY) {
    throw new Error("Weekly plans require a monthly parent task.");
  }

  if (isPeriodPast(plan.periodEnd)) {
    throw new Error("Cannot add tasks — this week has passed.");
  }

  const parent = await getTaskForUser(input.parentTaskId, userId, organizationId);
  if (!parent || parent.type !== PeriodType.MONTHLY) {
    throw new Error("Monthly parent task not found.");
  }

  if (isPeriodPast(parent.periodEnd)) {
    throw new Error("Cannot add sub-tasks — the monthly period has passed.");
  }

  const { periodStart: monthStart, periodEnd: monthEnd } = getMonthBoundsForDate(
    formatDateInTz(plan.periodStart),
  );
  if (parent.periodStart < monthStart || parent.periodStart > monthEnd) {
    throw new Error("Monthly task is not in the same month as this weekly plan.");
  }

  const existing = await db.planItem.findFirst({
    where: {
      planId: plan.id,
      task: { parentTaskId: parent.id },
    },
  });
  if (existing) {
    throw new Error("This monthly task is already on the weekly plan.");
  }

  const task = await db.task.create({
    data: {
      userId,
      organizationId,
      type: PeriodType.WEEKLY,
      title: parent.title,
      description: parent.description,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      parentTaskId: parent.id,
    },
  });

  return createPlanItemForTask(
    plan.id,
    task.id,
    parent.title,
    parent.description,
    input.visibility,
  );
}

export async function createDailySubTaskForPlan(
  planId: string,
  userId: string,
  organizationId: string,
  input: FromParentTaskInput,
) {
  const plan = await assertPlanForTaskAdd(planId, userId, organizationId);

  if (plan.type !== PeriodType.DAILY) {
    throw new Error("Daily plans require a weekly parent task.");
  }

  if (isPeriodPast(plan.periodEnd)) {
    throw new Error("Cannot add tasks — this day has passed.");
  }

  const parent = await getTaskForUser(input.parentTaskId, userId, organizationId);
  if (!parent || parent.type !== PeriodType.WEEKLY) {
    throw new Error("Weekly parent task not found.");
  }

  if (isPeriodPast(parent.periodEnd)) {
    throw new Error("Cannot add sub-tasks — the weekly period has passed.");
  }

  const day = plan.periodStart;
  if (day < parent.periodStart || day > parent.periodEnd) {
    throw new Error("Weekly task is not in the same week as this daily plan.");
  }

  const existingDailyChild = await db.task.findFirst({
    where: {
      parentTaskId: parent.id,
      type: PeriodType.DAILY,
      periodStart: day,
    },
  });
  if (existingDailyChild) {
    throw new Error("A daily sub-task already exists for this weekly task.");
  }

  const existingOnPlan = await db.planItem.findFirst({
    where: {
      planId: plan.id,
      task: { parentTaskId: parent.id },
    },
  });
  if (existingOnPlan) {
    throw new Error("This weekly task is already on the daily plan.");
  }

  const task = await db.task.create({
    data: {
      userId,
      organizationId,
      type: PeriodType.DAILY,
      title: parent.title,
      description: parent.description,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      parentTaskId: parent.id,
    },
  });

  return createPlanItemForTask(
    plan.id,
    task.id,
    parent.title,
    parent.description,
    input.visibility,
  );
}

async function createPlanItemForTask(
  planId: string,
  taskId: string,
  title: string,
  description: string | null,
  visibility: "PUBLIC" | "PRIVATE",
) {
  const maxSort = await db.planItem.aggregate({
    where: { planId },
    _max: { sortOrder: true },
  });

  return db.planItem.create({
    data: {
      planId,
      taskId,
      customTitle: null,
      description,
      visibility,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          parentTaskId: true,
        },
      },
    },
  });
}

async function assertPlanForTaskAdd(
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
