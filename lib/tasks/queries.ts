import { PeriodType } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  formatDateInTz,
  getMonthBoundsForDate,
  isPeriodPast,
} from "@/lib/periods";

export type SelectableParentTask = {
  id: string;
  title: string;
  description: string | null;
  disabled: boolean;
  disabledReason?: string;
};

export async function getTaskForUser(
  taskId: string,
  userId: string,
  organizationId: string,
) {
  return db.task.findFirst({
    where: { id: taskId, userId, organizationId },
  });
}

/** Parent tasks available when adding items to a weekly or daily plan. */
export async function listSelectableParentTasks(
  planId: string,
  userId: string,
  organizationId: string,
): Promise<SelectableParentTask[]> {
  const plan = await db.plan.findFirst({
    where: { id: planId, userId, organizationId },
    include: {
      items: {
        include: {
          task: { select: { parentTaskId: true } },
        },
      },
    },
  });

  if (!plan) {
    return [];
  }

  if (plan.type === PeriodType.MONTHLY) {
    return [];
  }

  const usedParentIds = new Set(
    plan.items
      .map((item) => item.task?.parentTaskId)
      .filter((id): id is string => id !== null && id !== undefined),
  );

  if (plan.type === PeriodType.WEEKLY) {
    if (isPeriodPast(plan.periodEnd)) {
      return [];
    }

    const ref = formatDateInTz(plan.periodStart);
    const { periodStart: monthStart, periodEnd: monthEnd } =
      getMonthBoundsForDate(ref);

    if (isPeriodPast(monthEnd)) {
      return [];
    }

    const monthlyTasks = await db.task.findMany({
      where: {
        userId,
        organizationId,
        type: PeriodType.MONTHLY,
        periodStart: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { title: "asc" },
    });

    return monthlyTasks.map((task) => {
      const alreadyOnPlan = usedParentIds.has(task.id);
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        disabled: alreadyOnPlan,
        disabledReason: alreadyOnPlan
          ? "Already added to this weekly plan"
          : undefined,
      };
    });
  }

  if (plan.type === PeriodType.DAILY) {
    if (isPeriodPast(plan.periodEnd)) {
      return [];
    }

    const day = plan.periodStart;

    const weeklyTasks = await db.task.findMany({
      where: {
        userId,
        organizationId,
        type: PeriodType.WEEKLY,
        periodStart: { lte: day },
        periodEnd: { gte: day },
      },
      include: {
        childTasks: {
          where: {
            type: PeriodType.DAILY,
            periodStart: day,
          },
        },
      },
      orderBy: { title: "asc" },
    });

    return weeklyTasks.map((task) => {
      const alreadyOnPlan = usedParentIds.has(task.id);
      const hasDailyChild = task.childTasks.length > 0;
      const weekPassed = isPeriodPast(task.periodEnd);
      const disabled = alreadyOnPlan || hasDailyChild || weekPassed;

      let disabledReason: string | undefined;
      if (alreadyOnPlan) {
        disabledReason = "Already added to this daily plan";
      } else if (hasDailyChild) {
        disabledReason = "Daily sub-task already created";
      } else if (weekPassed) {
        disabledReason = "Week has passed";
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        disabled,
        disabledReason,
      };
    });
  }

  return [];
}

export async function listUserTasks(
  userId: string,
  organizationId: string,
  options: { type?: PeriodType; search?: string } = {},
) {
  const { type, search } = options;
  const normalizedSearch = search?.trim();

  return db.task.findMany({
    where: {
      userId,
      organizationId,
      ...(type ? { type } : {}),
      ...(normalizedSearch
        ? { title: { contains: normalizedSearch, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ periodStart: "desc" }, { title: "asc" }],
    include: {
      parentTask: { select: { id: true, title: true, type: true } },
      _count: { select: { childTasks: true } },
    },
  });
}

export type SelectableReportTask = {
  id: string;
  title: string;
  description: string | null;
  type: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  parentTitle: string | null;
  disabled: boolean;
  disabledReason?: string;
};

/** User tasks available when adding unplanned work to a report. */
export async function listSelectableTasksForReport(
  reportId: string,
  userId: string,
  organizationId: string,
  options: { search?: string; type?: PeriodType } = {},
): Promise<SelectableReportTask[]> {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
    include: {
      entries: {
        where: { taskId: { not: null } },
        select: { taskId: true },
      },
    },
  });

  if (!report) {
    return [];
  }

  const usedTaskIds = new Set(
    report.entries
      .map((entry) => entry.taskId)
      .filter((id): id is string => id !== null),
  );

  const tasks = await listUserTasks(userId, organizationId, options);

  return tasks.map((task) => {
    const alreadyOnReport = usedTaskIds.has(task.id);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      periodStart: task.periodStart,
      periodEnd: task.periodEnd,
      parentTitle: task.parentTask?.title ?? null,
      disabled: alreadyOnReport,
      disabledReason: alreadyOnReport
        ? "Already on this report"
        : undefined,
    };
  });
}
