import Link from "next/link";

import { PeriodType } from "@/app/generated/prisma/enums";
import { CreateReportForm } from "@/components/reports/create-report-form";
import { ReportsList } from "@/components/reports/reports-list";
import { buttonVariants } from "@/components/ui/button";
import { listUserReports } from "@/lib/reports/queries";
import { periodTypeLabel, todayDateString } from "@/lib/periods";
import { requireSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

const VALID_TYPES = new Set<string>(Object.values(PeriodType));

export default async function MyReportsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const typeFilter =
    params.type && VALID_TYPES.has(params.type)
      ? (params.type as PeriodType)
      : undefined;

  const reports = await listUserReports(
    session.user.id,
    session.user.organizationId,
    { type: typeFilter },
  );

  const today = todayDateString();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">
          File backward-looking reports for work you completed.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Create a report</h2>
        <CreateReportForm
          defaultType={typeFilter ?? PeriodType.DAILY}
          defaultDate={today}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Your reports</h2>
          <div className="flex flex-wrap gap-2">
            <FilterLink href="/my-reports" active={!typeFilter} label="All" />
            {Object.values(PeriodType).map((type) => (
              <FilterLink
                key={type}
                href={`/my-reports?type=${type}`}
                active={typeFilter === type}
                label={periodTypeLabel(type)}
              />
            ))}
          </div>
        </div>
        <ReportsList reports={reports} />
      </section>
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
      )}
    >
      {label}
    </Link>
  );
}
