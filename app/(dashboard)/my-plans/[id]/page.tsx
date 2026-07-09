import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PlanEditor,
  type SerializedPlan,
} from "@/components/plans/plan-editor";
import { requireSession } from "@/lib/auth";
import { getPlanItemTitle } from "@/lib/plans/item-title";
import { getPlanById } from "@/lib/plans/queries";
import { canEditPeriod } from "@/lib/periods";

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

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        ← Back to Home
      </Link>
      <PlanEditor plan={serializePlan(plan)} />
    </div>
  );
}
