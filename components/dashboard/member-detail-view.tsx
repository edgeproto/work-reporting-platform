"use client";

import { PeriodType, PlanItemOutcome } from "@/app/generated/prisma/enums";
import { FilingPeriodShell } from "@/components/filing/filing-period-shell";
import { FilingSection } from "@/components/filing/filing-section";
import { useI18n } from "@/components/i18n-provider";
import { PlanItemOutcomeBadge, VisibilityBadge } from "@/components/plans/plan-badges";
import { formatDashboardTimestamp } from "@/lib/dashboard/period";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { cn } from "@/lib/utils";
import { filingSectionClassName } from "@/lib/filing/action-meta";

type MemberDetailPlanItem = {
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  outcome: PlanItemOutcome;
};

type MemberDetailReportEntry = {
  id: string;
  title: string;
  description: string | null;
  hours: number;
  visibility: "PUBLIC" | "PRIVATE";
};

type MemberDetailViewProps = {
  backHref: string;
  backLabel: string;
  memberName: string;
  memberSubtitle: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  plan: {
    type: PeriodType;
    submittedAt: string | null;
    updatedAt: string;
    items: MemberDetailPlanItem[];
  } | null;
  report: {
    type: PeriodType;
    submittedAt: string | null;
    updatedAt: string;
    entries: MemberDetailReportEntry[];
  } | null;
  completionPct: number | null;
  totalHours: number;
  showTimestamps: boolean;
  timeZone: string;
  dict: Dictionary;
};

function ChangeTimestamps({
  submittedAt,
  updatedAt,
  timeZone,
  dict,
}: {
  submittedAt: string | null;
  updatedAt: string;
  timeZone: string;
  dict: Dictionary;
}) {
  const { locale } = useI18n();
  const changedAfterSubmit =
    submittedAt &&
    new Date(updatedAt).getTime() > new Date(submittedAt).getTime() + 1000;

  return (
    <div className="mt-3 space-y-0.5 border-t pt-3 text-xs text-muted-foreground">
      {submittedAt ? (
        <p>
          {formatMessage(dict.dashboard.submittedAt, {
            timestamp: formatDashboardTimestamp(submittedAt, {
              locale,
              timeZone,
            }),
          })}
        </p>
      ) : null}
      {changedAfterSubmit ? (
        <p>
          {formatMessage(dict.dashboard.lastChangedAt, {
            timestamp: formatDashboardTimestamp(updatedAt, {
              locale,
              timeZone,
            }),
          })}
        </p>
      ) : null}
    </div>
  );
}

export function MemberDetailView({
  backHref,
  backLabel,
  memberName,
  memberSubtitle,
  periodType,
  periodStart,
  periodEnd,
  plan,
  report,
  completionPct,
  totalHours,
  showTimestamps,
  timeZone,
  dict,
}: MemberDetailViewProps) {
  const planFiling = plan
    ? { status: plan.submittedAt ? "submitted" : "draft" }
    : null;
  const reportFiling = report
    ? { status: report.submittedAt ? "submitted" : "draft" }
    : null;

  return (
    <FilingPeriodShell
      mode="viewer"
      backHref={backHref}
      backLabel={backLabel}
      periodType={periodType}
      periodStart={periodStart}
      periodEnd={periodEnd}
      plan={planFiling}
      report={reportFiling}
      heading={memberName}
      subheading={memberSubtitle}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={cn(filingSectionClassName, "text-3xl font-semibold")}>
          <p className="text-sm font-medium">{dict.dashboard.planComplete}</p>
          <p className="mt-1">
            {completionPct == null ? "—" : `${completionPct.toFixed(1)}%`}
          </p>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {dict.dashboard.planCompleteDescription}
          </p>
        </div>
        <div className={cn(filingSectionClassName, "text-3xl font-semibold")}>
          <p className="text-sm font-medium">{dict.dashboard.workingHours}</p>
          <p className="mt-1">{totalHours.toFixed(1)}</p>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {dict.dashboard.workingHoursDescription}
          </p>
        </div>
      </div>

      <FilingSection title={dict.common.plan}>
        {!plan ? (
          <p className="text-sm text-muted-foreground">{dict.dashboard.noPlan}</p>
        ) : plan.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.dashboard.noVisibleItems}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {plan.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.title}</span>
                <div className="flex items-center gap-2">
                  <VisibilityBadge visibility={item.visibility} />
                  {item.outcome !== PlanItemOutcome.OPEN ? (
                    <PlanItemOutcomeBadge outcome={item.outcome} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {dict.badges.open}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {showTimestamps && plan ? (
          <ChangeTimestamps
            submittedAt={plan.submittedAt}
            updatedAt={plan.updatedAt}
            timeZone={timeZone}
            dict={dict}
          />
        ) : null}
      </FilingSection>

      <FilingSection title={dict.common.report}>
        {!report ? (
          <p className="text-sm text-muted-foreground">{dict.dashboard.noReport}</p>
        ) : report.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.dashboard.noVisibleEntries}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {report.entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{entry.title}</p>
                  {entry.description ? (
                    <p className="text-muted-foreground">{entry.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <VisibilityBadge visibility={entry.visibility} />
                  <span className="text-muted-foreground">
                    {formatMessage(dict.feed.hoursShort, {
                      hours: entry.hours.toFixed(1),
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {showTimestamps && report ? (
          <ChangeTimestamps
            submittedAt={report.submittedAt}
            updatedAt={report.updatedAt}
            timeZone={timeZone}
            dict={dict}
          />
        ) : null}
      </FilingSection>
    </FilingPeriodShell>
  );
}
