import { notFound } from "next/navigation";

import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import {
  PlanEditor,
  type SerializedPlan,
} from "@/components/plans/plan-editor";
import { FilingPeriodShell } from "@/components/filing/filing-period-shell";
import { requireSession } from "@/lib/auth";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { getPlanById } from "@/lib/plans/queries";
import { canEditPeriod } from "@/lib/periods";
import { getReportForPeriod } from "@/lib/reports/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

function serializePlan(
  plan: NonNullable<Awaited<ReturnType<typeof getPlanById>>>,
): SerializedPlan {
  return {
    id: plan.id,
    type: plan.type,
    periodStart: plan.periodStart.toISOString(),
    periodEnd: plan.periodEnd.toISOString(),
    status: plan.status,
    submittedAt: plan.submittedAt?.toISOString() ?? null,
    periodEditable: canEditPeriod(plan.type, plan.periodStart, plan.periodEnd),
    items: plan.items.map((item) => ({
      id: item.id,
      title: getPlanItemTitle(item),
      description: item.description,
      visibility: item.visibility,
      outcome: item.outcome,
      attachments: item.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
    })),
  };
}

export default async function PlanEditorPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const plan = await getPlanById(
    id,
    session.user.id,
    session.user.organizationId,
  );

  if (!plan) {
    notFound();
  }

  const reportForPeriod = await getReportForPeriod(
    session.user.id,
    session.user.organizationId,
    plan.type,
    plan.periodStart,
  );

  return (
    <FilingPeriodShell
      periodType={plan.type}
      periodStart={plan.periodStart.toISOString()}
      periodEnd={plan.periodEnd.toISOString()}
      periodEditable={canEditPeriod(plan.type, plan.periodStart, plan.periodEnd)}
      plan={{ status: plan.status }}
      report={reportForPeriod ? { status: reportForPeriod.status } : null}
      activeFiling="plan"
      headerActions={
        <DeletePlanButton planId={plan.id} variant="destructive" />
      }
    >
      <PlanEditor plan={serializePlan(plan)} />
    </FilingPeriodShell>
  );
}
