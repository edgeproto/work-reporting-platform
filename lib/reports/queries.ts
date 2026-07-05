import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";

export type ReportListFilters = {
  type?: PeriodType;
  status?: SubmissionStatus;
  limit?: number;
};

export async function listUserReports(
  userId: string,
  organizationId: string,
  filters: ReportListFilters = {},
) {
  const { type, status, limit = 50 } = filters;

  return db.report.findMany({
    where: {
      userId,
      organizationId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ periodStart: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      _count: { select: { entries: true } },
    },
  });
}

export async function getReportById(
  reportId: string,
  userId: string,
  organizationId: string,
) {
  return db.report.findFirst({
    where: {
      id: reportId,
      userId,
      organizationId,
    },
    include: {
      entries: {
        orderBy: { sortOrder: "asc" },
        include: {
          planItem: {
            select: {
              id: true,
              taskId: true,
              task: { select: { id: true, title: true } },
              taskTitle: { select: { id: true, title: true } },
              customTitle: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              type: true,
              parentTask: { select: { id: true, title: true, type: true } },
            },
          },
          taskTitle: { select: { id: true, title: true } },
          attachments: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
        },
      },
    },
  });
}

/** Submitted plan for the same user, type, and period — used for report check-off. */
export async function getSubmittedPlanForReport(
  userId: string,
  organizationId: string,
  type: PeriodType,
  periodStart: Date,
) {
  return db.plan.findFirst({
    where: {
      userId,
      organizationId,
      type,
      periodStart,
      status: SubmissionStatus.SUBMITTED,
    },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              parentTaskId: true,
              parentTask: { select: { id: true, title: true, type: true } },
            },
          },
          taskTitle: { select: { id: true, title: true } },
        },
      },
    },
  });
}
