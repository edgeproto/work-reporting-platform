import Link from "next/link";
import { notFound } from "next/navigation";

import { PlanItemOutcomeBadge, VisibilityBadge } from "@/components/plans/plan-badges";
import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import {
  dashboardFiltersToSearchParams,
  parseDashboardFilters,
  type DashboardSearchParams,
} from "@/lib/dashboard/filters";
import { fetchMemberDetail } from "@/lib/dashboard/queries";
import { formatDashboardTimestamp } from "@/lib/dashboard/period";
import { isManagerOrAbove } from "@/lib/rbac";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatMessage } from "@/lib/i18n/format";
import { periodTypeLabel } from "@/lib/i18n/period-labels";
import { formatPeriodLabel } from "@/lib/periods";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<DashboardSearchParams>;
};

function ChangeTimestamps({
  submittedAt,
  updatedAt,
  dict,
}: {
  submittedAt: Date | null;
  updatedAt: Date;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const changedAfterSubmit =
    submittedAt &&
    updatedAt.getTime() > submittedAt.getTime() + 1000;

  return (
    <div className="mt-3 space-y-0.5 border-t pt-3 text-xs text-muted-foreground">
      {submittedAt ? (
        <p>
          {formatMessage(dict.dashboard.submittedAt, {
            timestamp: formatDashboardTimestamp(submittedAt),
          })}
        </p>
      ) : null}
      {changedAfterSubmit ? (
        <p>
          {formatMessage(dict.dashboard.lastChangedAt, {
            timestamp: formatDashboardTimestamp(updatedAt),
          })}
        </p>
      ) : null}
    </div>
  );
}

export default async function MemberDashboardPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireSession();
  const { userId } = await params;
  const query = await searchParams;
  const filters = parseDashboardFilters(query);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const viewer = {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };

  const detail = await fetchMemberDetail(viewer, userId, filters);
  if (!detail) {
    notFound();
  }

  const backQs = dashboardFiltersToSearchParams(filters).toString();
  const periodLabel = formatPeriodLabel(
    filters.periodType,
    filters.periodStart,
    filters.periodEnd,
    undefined,
    locale,
    dict.periods,
  );
  const showTimestamps = isManagerOrAbove(viewer);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard${backQs ? `?${backQs}` : ""}`}
          className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {dict.dashboard.backToDashboard}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {detail.member.name}
        </h1>
        <p className="text-muted-foreground">
          {dict.roles[detail.member.role]} · {periodLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.planComplete}</CardTitle>
            <CardDescription>{dict.dashboard.planCompleteDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {detail.completionPct == null
              ? "—"
              : `${detail.completionPct.toFixed(1)}%`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.workingHours}</CardTitle>
            <CardDescription>{dict.dashboard.workingHoursDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {detail.totalHours.toFixed(1)}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{dict.common.plan}</h2>
        {!detail.plan ? (
          <p className="text-sm text-muted-foreground">{dict.dashboard.noPlan}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {formatMessage(dict.dashboard.planTitle, {
                  type: periodTypeLabel(detail.plan.type, dict),
                })}
              </CardTitle>
              <CardDescription>
                {formatPeriodLabel(
                  detail.plan.type,
                  detail.plan.periodStart,
                  detail.plan.periodEnd,
                  undefined,
                  locale,
                  dict.periods,
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.plan.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dict.dashboard.noVisibleItems}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {detail.plan.items.map((item) => (
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
                          <span className="text-xs text-muted-foreground">{dict.badges.open}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {showTimestamps ? (
                <ChangeTimestamps
                  submittedAt={detail.plan.submittedAt}
                  updatedAt={detail.plan.updatedAt}
                  dict={dict}
                />
              ) : null}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{dict.common.report}</h2>
        {!detail.report ? (
          <p className="text-sm text-muted-foreground">{dict.dashboard.noReport}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {formatMessage(dict.dashboard.reportTitle, {
                  type: periodTypeLabel(detail.report.type, dict),
                })}
              </CardTitle>
              <CardDescription>
                {formatPeriodLabel(
                  detail.report.type,
                  detail.report.periodStart,
                  detail.report.periodEnd,
                  undefined,
                  locale,
                  dict.periods,
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detail.report.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{dict.dashboard.noVisibleEntries}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {detail.report.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{entry.title}</p>
                        {entry.description ? (
                          <p className="text-muted-foreground">
                            {entry.description}
                          </p>
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
              {showTimestamps ? (
                <ChangeTimestamps
                  submittedAt={detail.report.submittedAt}
                  updatedAt={detail.report.updatedAt}
                  dict={dict}
                />
              ) : null}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
