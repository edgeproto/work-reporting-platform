"use client";

import { SubmissionStatus } from "@/app/generated/prisma/enums";
import { useDictionary } from "@/components/i18n-provider";
import {
  FilingMissingBadge,
  PlanStatusBadge,
} from "@/components/plans/plan-badges";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import { cn } from "@/lib/utils";

type FilingStatusStripProps = {
  plan: { status: string } | null | undefined;
  report: { status: string } | null | undefined;
  className?: string;
};

export function FilingStatusStrip({
  plan,
  report,
  className,
}: FilingStatusStripProps) {
  const dict = useDictionary();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/50 px-3 py-2",
        className,
      )}
      role="status"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">
          {dict.common.plan}
        </span>
        {plan ? (
          <PlanStatusBadge
            status={
              plan.status === "submitted"
                ? SubmissionStatus.SUBMITTED
                : SubmissionStatus.DRAFT
            }
          />
        ) : (
          <FilingMissingBadge />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-foreground">
          {dict.common.report}
        </span>
        {report ? (
          <ReportStatusBadge
            status={
              report.status === "submitted"
                ? SubmissionStatus.SUBMITTED
                : SubmissionStatus.DRAFT
            }
          />
        ) : (
          <FilingMissingBadge />
        )}
      </div>
    </div>
  );
}
