import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ReportEditor,
  type SerializedMatchingPlan,
  type SerializedReport,
} from "@/components/reports/report-editor";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { requireSession } from "@/lib/auth";
import { getReportById, getSubmittedPlanForReport } from "@/lib/reports/queries";

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
      title:
        entry.taskTitle?.title ??
        entry.planItem?.task?.title ??
        entry.planItem?.taskTitle?.title ??
        entry.planItem?.customTitle ??
        entry.customTitle ??
        "Untitled",
      description: entry.description,
      hours: entry.hours.toString(),
      visibility: entry.visibility,
      attachmentCount: entry.attachments.length,
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

  const submittedPlan = await getSubmittedPlanForReport(
    session.user.id,
    session.user.organizationId,
    report.type,
    report.periodStart,
  );

  const matchingPlan = submittedPlan
    ? serializeMatchingPlan(submittedPlan)
    : null;

  return (
    <div className="space-y-4">
      <Link
        href="/my-reports"
        className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        ← Back to My Reports
      </Link>
      <ReportEditor report={serializeReport(report, matchingPlan)} />
    </div>
  );
}
