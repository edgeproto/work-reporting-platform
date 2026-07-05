import Link from "next/link";

import { PeriodType } from "@/app/generated/prisma/enums";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import { PlanStatusBadge } from "@/components/plans/plan-badges";
import { Badge } from "@/components/ui/badge";
import {
  formatPeriodLabel,
  periodTypeLabel,
} from "@/lib/periods";

type PlanListItem = {
  id: string;
  type: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  status: "DRAFT" | "SUBMITTED";
  updatedAt: Date;
  _count: { items: number };
};

export function PlansList({ plans }: { plans: PlanListItem[] }) {
  if (plans.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No plans yet. Create one above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-center gap-2">
          <Link
            href={`/my-plans/${plan.id}`}
            className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {formatPeriodLabel(plan.type, plan.periodStart, plan.periodEnd)}
                </span>
                <Badge variant="outline">{periodTypeLabel(plan.type)}</Badge>
                <PlanStatusBadge status={plan.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {plan._count.items} task{plan._count.items === 1 ? "" : "s"}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">Edit →</span>
          </Link>
          <div className="pr-3">
            <DeletePlanButton planId={plan.id} size="icon-sm" variant="ghost" />
          </div>
        </li>
      ))}
    </ul>
  );
}
