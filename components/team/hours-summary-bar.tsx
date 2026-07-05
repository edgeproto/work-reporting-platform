import { aggregateHours, formatHoursTotal } from "@/lib/reports/aggregate-hours";

type HoursSummaryBarProps = {
  entries: { hours: number }[];
  entryCount: number;
  planItemCount: number;
  showPrivateNote?: boolean;
};

export function HoursSummaryBar({
  entries,
  entryCount,
  planItemCount,
  showPrivateNote = false,
}: HoursSummaryBarProps) {
  const totalHours = aggregateHours(entries);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium">Hours summary</p>
        <p className="text-xs text-muted-foreground">
          {entryCount} report entr{entryCount === 1 ? "y" : "ies"}
          {planItemCount > 0 &&
            ` · ${planItemCount} plan item${planItemCount === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-semibold tabular-nums">
          {formatHoursTotal(totalHours)}
        </p>
        {showPrivateNote && (
          <p className="text-xs text-muted-foreground">
            Includes private entries
          </p>
        )}
      </div>
    </div>
  );
}
