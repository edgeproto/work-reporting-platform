import { db } from "@/lib/db";

export function normalizeTaskTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export async function upsertTaskTitle(
  organizationId: string,
  createdById: string,
  title: string,
  description?: string | null,
) {
  const normalized = normalizeTaskTitle(title);
  if (!normalized) {
    throw new Error("Task title cannot be empty.");
  }

  const desc = description?.trim() || null;

  return db.taskTitle.upsert({
    where: {
      organizationId_title: {
        organizationId,
        title: normalized,
      },
    },
    create: {
      title: normalized,
      description: desc,
      organizationId,
      createdById,
    },
    update: {
      ...(desc !== null ? { description: desc } : {}),
    },
  });
}

/** Catalog tasks available to add to a plan (not on plan yet, not completed). */
export async function listSelectableTaskTitles(
  organizationId: string,
  userId: string,
  planId: string,
) {
  const onPlan = await db.planItem.findMany({
    where: { planId, taskTitleId: { not: null } },
    select: { taskTitleId: true },
  });
  const onPlanIds = onPlan
    .map((item) => item.taskTitleId)
    .filter((id): id is string => id !== null);

  const completed = await db.planItem.findMany({
    where: {
      completedAt: { not: null },
      taskTitleId: { not: null },
      plan: { userId, organizationId },
    },
    select: { taskTitleId: true },
    distinct: ["taskTitleId"],
  });
  const completedIds = completed
    .map((item) => item.taskTitleId)
    .filter((id): id is string => id !== null);

  const excludeIds = [...new Set([...onPlanIds, ...completedIds])];

  return db.taskTitle.findMany({
    where: {
      organizationId,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: { title: "asc" },
    select: { id: true, title: true, description: true },
  });
}

export async function getTaskTitle(
  organizationId: string,
  taskTitleId: string,
) {
  return db.taskTitle.findFirst({
    where: { id: taskTitleId, organizationId },
    select: { id: true, title: true, description: true },
  });
}
