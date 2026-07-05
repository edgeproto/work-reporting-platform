import Link from "next/link";
import { notFound } from "next/navigation";

import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";

import {
  ReportEditor,
  type SerializedMatchingPlan,
  type SerializedReport,
} from "@/components/reports/report-editor";
import {
  serializeSelectableTask,
  type SerializedSelectableTask,
} from "@/lib/tasks/serialize";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { requireSession } from "@/lib/auth";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import { prefillWeeklyMonthlyReportFromDailyEntries } from "@/lib/reports/create-draft";
import { getReportById, getSubmittedPlanForReport } from "@/lib/reports/queries";
import { listSelectableTasksForReport } from "@/lib/tasks/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

function serializeMatchingPlan(
  plan: NonNullable<Awaited<ReturnType<typeof getSubmittedPlanForReport>>>,
): SerializedMatchingPlan {
  return {
    id: plan.id,
    continuousNotes: plan.continuousNotes,
    items: plan.items.map((item) => ({
      id: item.id,
      title: getPlanItemTitle(item),
      description: item.description,
      visibility: item.visibility,
      completedAt: item.completedAt?.toISOString() ?? null,
      completedInReportId: item.completedInReportId,
      taskType: item.task?.type ?? null,
      parentTitle: item.task?.parentTask?.title ?? null,
    })),
  };
}

function serializeReport(
  report: NonNullable<Awaited<ReturnType<typeof getReportById>>>,
  matchingPlan: SerializedMatchingPlan | null,
): SerializedReport {
  return {
    id: report.id,
    type: report.type,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    status: report.status,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    matchingPlan,
    entries: report.entries.map((entry) => ({
      id: entry.id,
      planItemId: entry.planItemId,
      title: getReportEntryTitle(entry),
      description: entry.description,
      hours: entry.hours.toString(),
      visibility: entry.visibility,
      attachments: entry.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
    })),
  };
}

export default async function ReportEditorPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const report = await getReportById(
    id,
    session.user.id,
    session.user.organizationId,
  );

  if (!report) {
    notFound();
  }

  const isDraftWeeklyOrMonthly =
    report.type !== PeriodType.DAILY && report.status === SubmissionStatus.DRAFT;

  if (isDraftWeeklyOrMonthly) {
    await prefillWeeklyMonthlyReportFromDailyEntries(
      id,
      session.user.id,
      session.user.organizationId,
    );
  }

  const editorReport = isDraftWeeklyOrMonthly
    ? ((await getReportById(id, session.user.id, session.user.organizationId)) ??
      report)
    : report;

  const [submittedPlan, selectableTasks] = await Promise.all([
    getSubmittedPlanForReport(
      session.user.id,
      session.user.organizationId,
      editorReport.type,
      editorReport.periodStart,
    ),
    listSelectableTasksForReport(
      id,
      session.user.id,
      session.user.organizationId,
    ),
  ]);

  const matchingPlan = submittedPlan
    ? serializeMatchingPlan(submittedPlan)
    : null;

  const serializedTasks: SerializedSelectableTask[] = selectableTasks.map(
    serializeSelectableTask,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/my-reports"
        className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        ← Back to My Reports
      </Link>
      <ReportEditor
        report={serializeReport(editorReport, matchingPlan)}
        selectableTasks={serializedTasks}
      />
    </div>
  );
}
