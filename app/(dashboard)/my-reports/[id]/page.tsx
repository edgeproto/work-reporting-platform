import { notFound } from "next/navigation";

import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import { FilingPeriodShell } from "@/components/filing/filing-period-shell";
import {
  ReportEditor,
  type SerializedMatchingPlan,
  type SerializedReport,
} from "@/components/reports/report-editor";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { requireSession } from "@/lib/auth";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { getPlanForPeriod } from "@/lib/plans/queries";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import {
  getReportById,
  getSubmittedPlanForReport,
} from "@/lib/reports/queries";
import { removeMechanicallyCopiedDailyEntries } from "@/lib/reports/create-draft";
import {
  addDays,
  canEditPeriod,
  formatDateInTz,
  getPeriodBounds,
} from "@/lib/periods";

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
      outcome: item.outcome,
      completedInReportId: item.completedInReportId,
    })),
  };
}

function serializeReport(
  report: NonNullable<Awaited<ReturnType<typeof getReportById>>>,
  matchingPlan: SerializedMatchingPlan | null,
): SerializedReport {
  const periodDay = formatDateInTz(report.periodStart);
  const periodEditable = canEditPeriod(
    report.type,
    report.periodStart,
    report.periodEnd,
  );

  let canFileTomorrowPlan = false;
  if (
    report.type === PeriodType.DAILY &&
    report.status === SubmissionStatus.SUBMITTED
  ) {
    const tomorrow = addDays(periodDay, 1);
    const tomorrowBounds = getPeriodBounds(PeriodType.DAILY, tomorrow);
    canFileTomorrowPlan = canEditPeriod(
      PeriodType.DAILY,
      tomorrowBounds.periodStart,
      tomorrowBounds.periodEnd,
    );
  }

  return {
    id: report.id,
    type: report.type,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    status: report.status,
    submittedAt: report.submittedAt?.toISOString() ?? null,
    periodEditable,
    canFileTomorrowPlan,
    periodDay,
    matchingPlan,
    entries: report.entries.map((entry) => ({
      id: entry.id,
      planItemId: entry.planItemId,
      planItemOutcome: entry.planItemOutcome,
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

  if (
    report.type !== PeriodType.DAILY &&
    report.status === SubmissionStatus.DRAFT
  ) {
    await removeMechanicallyCopiedDailyEntries(
      id,
      session.user.id,
      session.user.organizationId,
    );
  }

  const editorReport =
    report.type !== PeriodType.DAILY &&
    report.status === SubmissionStatus.DRAFT
      ? ((await getReportById(id, session.user.id, session.user.organizationId)) ??
        report)
      : report;

  const submittedPlan = await getSubmittedPlanForReport(
    session.user.id,
    session.user.organizationId,
    editorReport.type,
    editorReport.periodStart,
  );

  const planForPeriod = await getPlanForPeriod(
    session.user.id,
    session.user.organizationId,
    editorReport.type,
    editorReport.periodStart,
  );

  const matchingPlan = submittedPlan
    ? serializeMatchingPlan(submittedPlan)
    : null;

  return (
    <FilingPeriodShell
      periodType={editorReport.type}
      periodStart={editorReport.periodStart.toISOString()}
      periodEnd={editorReport.periodEnd.toISOString()}
      periodEditable={canEditPeriod(
        editorReport.type,
        editorReport.periodStart,
        editorReport.periodEnd,
      )}
      plan={planForPeriod ? { status: planForPeriod.status } : null}
      report={{ status: editorReport.status }}
      activeFiling="report"
      headerActions={
        <DeleteReportButton reportId={editorReport.id} variant="destructive" />
      }
    >
      <ReportEditor report={serializeReport(editorReport, matchingPlan)} />
    </FilingPeriodShell>
  );
}
