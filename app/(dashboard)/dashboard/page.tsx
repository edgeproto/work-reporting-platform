import { requireSession } from "@/lib/auth";
import {
  DashboardFiltersForm,
  MemberRosterTable,
} from "@/components/dashboard/member-roster";
import {
  parseDashboardFilters,
  type DashboardSearchParams,
} from "@/lib/dashboard/filters";
import { fetchMemberRoster } from "@/lib/dashboard/queries";
import { isManagerOrAbove } from "@/lib/rbac";
import { formatPeriodLabel, getOrgTimezone } from "@/lib/periods";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

type PageProps = {
  searchParams: Promise<DashboardSearchParams>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const filters = parseDashboardFilters(params);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const viewer = {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };

  const rows = await fetchMemberRoster(viewer, filters);
  const periodLabel = formatPeriodLabel(
    filters.periodType,
    filters.periodStart,
    filters.periodEnd,
    undefined,
    locale,
    dict.periods,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.nav.teamFeed}
        </h1>
        <p className="text-muted-foreground">
          {formatMessage(dict.dashboard.subtitle, { period: periodLabel })}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{dict.dashboard.period}</h2>
        <DashboardFiltersForm filters={filters} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{dict.dashboard.members}</h2>
        <MemberRosterTable
          rows={rows}
          filters={filters}
          roleLabels={dict.roles}
          showChangeTimestamps={isManagerOrAbove(viewer)}
          timeZone={getOrgTimezone()}
        />
      </section>
    </div>
  );
}
