import Link from "next/link";
import { notFound } from "next/navigation";

import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";

import {
  ReportEditor,
  type SerializedMatchingPlan,
  type SerializedReport,
} from "@/components/reports/report-editor";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { requireSession } from "@/lib/auth";
import { getReportEntryTitle } from "@/lib/reports/entry-title";
import { prefillWeeklyMonthlyReportFromDailyEntries } from "@/lib/reports/create-draft";
import { getReportById, getSubmittedPlanForReport } from "@/lib/reports/queries";
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
      completedAt: item.completedAt?.toISOString() ?? null,
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

  const submittedPlan = await getSubmittedPlanForReport(
    session.user.id,
    session.user.organizationId,
    editorReport.type,
    editorReport.periodStart,
  );

  const matchingPlan = submittedPlan
    ? serializeMatchingPlan(submittedPlan)
    : null;

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        ← Back to Home
      </Link>
      <ReportEditor report={serializeReport(editorReport, matchingPlan)} />
    </div>
  );
}
