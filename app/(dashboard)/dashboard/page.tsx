import { requireSession } from "@/lib/auth";
import {
  DashboardFiltersForm,
  MemberRosterTable,
} from "@/components/dashboard/member-roster";
import {
  fetchMemberRoster,
  parseDashboardFilters,
  type DashboardSearchParams,
} from "@/lib/dashboard/queries";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Team roster with plan completion and working hours for the selected
          range.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Date range</h2>
        <DashboardFiltersForm filters={filters} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Members</h2>
        <MemberRosterTable
          rows={rows}
          filters={filters}
          roleLabels={dict.roles}
        />
      </section>
    </div>
  );
}
