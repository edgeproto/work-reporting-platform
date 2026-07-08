import Link from "next/link";
import { notFound } from "next/navigation";

import { VisibilityBadge } from "@/components/plans/plan-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import {
  fetchMemberDetail,
  parseDashboardFilters,
  type DashboardSearchParams,
} from "@/lib/dashboard/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { formatPeriodLabel, periodTypeLabel } from "@/lib/periods";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<DashboardSearchParams>;
};

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

  const backParams = new URLSearchParams();
  if (filters.rangePreset !== "week") {
    backParams.set("range", filters.rangePreset);
  }
  if (filters.rangePreset === "custom") {
    backParams.set("from", filters.dateFrom.toISOString().slice(0, 10));
    backParams.set("to", filters.dateTo.toISOString().slice(0, 10));
  }
  if (filters.sort !== "name") {
    backParams.set("sort", filters.sort);
  }
  if (!(filters.sort === "name" && filters.dir === "asc")) {
    backParams.set("dir", filters.dir);
  }
  const backQs = backParams.toString();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard${backQs ? `?${backQs}` : ""}`}
          className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {detail.member.name}
        </h1>
        <p className="text-muted-foreground">
          {dict.roles[detail.member.role]} ·{" "}
          {filters.dateFrom.toISOString().slice(0, 10)} –{" "}
          {filters.dateTo.toISOString().slice(0, 10)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan complete</CardTitle>
            <CardDescription>Submitted plan items in range</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {detail.completionPct == null
              ? "—"
              : `${detail.completionPct.toFixed(1)}%`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Working hours</CardTitle>
            <CardDescription>Visible report hours in range</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {detail.totalHours.toFixed(1)}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Plans</h2>
        {detail.plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submitted plans in this range.
          </p>
        ) : (
          <ul className="space-y-3">
            {detail.plans.map((plan) => (
              <li key={plan.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {periodTypeLabel(plan.type)} plan
                    </CardTitle>
                    <CardDescription>
                      {formatPeriodLabel(
                        plan.type,
                        plan.periodStart,
                        plan.periodEnd,
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plan.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No visible items.
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
                              <span className="text-xs text-muted-foreground">
                                {item.completed ? "Completed" : "Open"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Reports</h2>
        {detail.reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No submitted reports in this range.
          </p>
        ) : (
          <ul className="space-y-3">
            {detail.reports.map((report) => (
              <li key={report.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {periodTypeLabel(report.type)} report
                    </CardTitle>
                    <CardDescription>
                      {formatPeriodLabel(
                        report.type,
                        report.periodStart,
                        report.periodEnd,
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No visible entries.
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
                                <p className="text-muted-foreground">
                                  {entry.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <VisibilityBadge visibility={entry.visibility} />
                              <span className="text-muted-foreground">
                                {entry.hours.toFixed(1)} h
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
