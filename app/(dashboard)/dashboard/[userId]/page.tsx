import { notFound } from "next/navigation";

import { MemberDetailView } from "@/components/dashboard/member-detail-view";
import { requireSession } from "@/lib/auth";
import {
  dashboardFiltersToSearchParams,
  parseDashboardFilters,
  type DashboardSearchParams,
} from "@/lib/dashboard/filters";
import { fetchMemberDetail } from "@/lib/dashboard/queries";
import { isManagerOrAbove } from "@/lib/rbac";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatPeriodLabel, getOrgTimezone } from "@/lib/periods";

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

  const backQs = dashboardFiltersToSearchParams(filters).toString();
  const periodLabel = formatPeriodLabel(
    filters.periodType,
    filters.periodStart,
    filters.periodEnd,
    undefined,
    locale,
    dict.periods,
  );

  return (
    <MemberDetailView
      backHref={`/dashboard${backQs ? `?${backQs}` : ""}`}
      backLabel={dict.dashboard.backToDashboard}
      memberName={detail.member.name}
      memberSubtitle={`${dict.roles[detail.member.role]} · ${periodLabel}`}
      periodType={filters.periodType}
      periodStart={filters.periodStart.toISOString()}
      periodEnd={filters.periodEnd.toISOString()}
      plan={
        detail.plan
          ? {
              type: detail.plan.type,
              submittedAt: detail.plan.submittedAt?.toISOString() ?? null,
              updatedAt: detail.plan.updatedAt.toISOString(),
              items: detail.plan.items,
            }
          : null
      }
      report={
        detail.report
          ? {
              type: detail.report.type,
              submittedAt: detail.report.submittedAt?.toISOString() ?? null,
              updatedAt: detail.report.updatedAt.toISOString(),
              entries: detail.report.entries.map((entry) => ({
                id: entry.id,
                title: entry.title,
                description: entry.description,
                hours: entry.hours,
                visibility: entry.visibility,
              })),
            }
          : null
      }
      completionPct={detail.completionPct}
      totalHours={detail.totalHours}
      showTimestamps={isManagerOrAbove(viewer)}
      timeZone={getOrgTimezone()}
      dict={dict}
    />
  );
}
