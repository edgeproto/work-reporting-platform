import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PlanEditor,
  type SerializedPlan,
} from "@/components/plans/plan-editor";
import { requireSession } from "@/lib/auth";
import { getPlanById } from "@/lib/plans/queries";
import { isPeriodPast } from "@/lib/periods";
import { listSelectableParentTasks } from "@/lib/tasks/queries";

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
    periodPassed: isPeriodPast(plan.periodEnd),
    items: plan.items.map((item) => ({
      id: item.id,
      title:
        item.task?.title ??
        item.taskTitle?.title ??
        item.customTitle ??
        "Untitled",
      description: item.description,
      visibility: item.visibility,
      completedAt: item.completedAt?.toISOString() ?? null,
      taskType: item.task?.type ?? null,
      parentTitle: item.task?.parentTask?.title ?? null,
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

  const selectableParents = await listSelectableParentTasks(
    plan.id,
    session.user.id,
    session.user.organizationId,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/my-plans"
        className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        ← Back to My Plans
      </Link>
      <PlanEditor
        plan={serializePlan(plan)}
        selectableParents={selectableParents}
      />
    </div>
  );
}
