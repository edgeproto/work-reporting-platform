import Link from "next/link";

import { PeriodType } from "@/app/generated/prisma/enums";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import { Badge } from "@/components/ui/badge";
import { formatPeriodLabel, periodTypeLabel } from "@/lib/periods";

type ReportListItem = {
  id: string;
  type: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  status: "DRAFT" | "SUBMITTED";
  updatedAt: Date;
  _count: { entries: number };
};

export function ReportsList({ reports }: { reports: ReportListItem[] }) {
  if (reports.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No reports yet. Create one above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {reports.map((report) => (
        <li key={report.id} className="flex items-center gap-2">
          <Link
            href={`/my-reports/${report.id}`}
            className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {formatPeriodLabel(
                    report.type,
                    report.periodStart,
                    report.periodEnd,
                  )}
                </span>
                <Badge variant="outline">{periodTypeLabel(report.type)}</Badge>
                <ReportStatusBadge status={report.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {report._count.entries} entr
                {report._count.entries === 1 ? "y" : "ies"}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">Edit →</span>
          </Link>
          <div className="pr-3">
            <DeleteReportButton
              reportId={report.id}
              size="icon-sm"
              variant="ghost"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
