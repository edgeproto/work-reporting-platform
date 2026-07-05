import { requireSession } from "@/lib/auth";
import { aggregateHours } from "@/lib/reports/aggregate-hours";
import { parseTeamFilters, type TeamSearchParams } from "@/lib/team/filters";
import { fetchTeamViewData } from "@/lib/team/queries";
import { HoursSummaryBar } from "@/components/team/hours-summary-bar";
import { TeamFiltersForm } from "@/components/team/team-filters";
import { TeamTimeline } from "@/components/team/team-timeline";

type PageProps = {
  searchParams: Promise<TeamSearchParams>;
};

export default async function TeamPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const filters = parseTeamFilters(params);

  const viewer = {
    id: session.user.id,
    role: session.user.role,
    organizationId: session.user.organizationId,
  };

  const { members, taskTitles, reportEntries, planItems, timeline, managerView } =
    await fetchTeamViewData(viewer, filters);

  const hoursEntries = reportEntries.map((entry) => ({
    hours: Number(entry.hours) || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {managerView ? "Team Dashboard" : "Team Feed"}
        </h1>
        <p className="text-muted-foreground">
          {managerView
            ? "View submitted plans and reports from your team, including private entries."
            : "View public plans and report entries filed by your teammates."}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Filters</h2>
        <TeamFiltersForm
          filters={filters}
          members={members}
          taskTitles={taskTitles}
          managerView={managerView}
        />
      </section>

      {(filters.view === "all" || filters.view === "reports") && (
        <HoursSummaryBar
          entries={hoursEntries}
          entryCount={reportEntries.length}
          planItemCount={filters.view === "all" ? planItems.length : 0}
          showPrivateNote={managerView}
        />
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">
            {filters.view === "plans"
              ? "Team plans"
              : filters.view === "reports"
                ? "Team reports"
                : "Team activity"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {timeline.length} item{timeline.length === 1 ? "" : "s"}
            {filters.view !== "plans" && reportEntries.length > 0 && (
              <>
                {" "}
                · {aggregateHours(hoursEntries).toFixed(1)} h total
              </>
            )}
          </p>
        </div>
        <TeamTimeline items={timeline} />
      </section>
    </div>
  );
}
