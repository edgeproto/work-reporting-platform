import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";

export type PlanListFilters = {
  type?: PeriodType;
  status?: SubmissionStatus;
  limit?: number;
};

export async function listUserPlans(
  userId: string,
  organizationId: string,
  filters: PlanListFilters = {},
) {
  const { type, status, limit = 50 } = filters;

  return db.plan.findMany({
    where: {
      userId,
      organizationId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ periodStart: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function getPlanById(
  planId: string,
  userId: string,
  organizationId: string,
) {
  return db.plan.findFirst({
    where: {
      id: planId,
      userId,
      organizationId,
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          taskTitle: { select: { id: true, title: true } },
        },
      },
    },
  });
}

export async function getPlanForPeriod(
  userId: string,
  organizationId: string,
  type: PeriodType,
  periodStart: Date,
) {
  return db.plan.findUnique({
    where: {
      userId_type_periodStart: {
        userId,
        type,
        periodStart,
      },
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          taskTitle: { select: { id: true, title: true } },
        },
      },
    },
  });
}
