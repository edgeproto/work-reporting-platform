import { VisibilityBadge } from "@/components/plans/plan-badges";
import { Badge } from "@/components/ui/badge";
import {
  formatPeriodLabel,
  periodTypeLabel,
} from "@/lib/periods";
import type { TeamTimelineItem } from "@/lib/team/queries";

type TeamTimelineProps = {
  items: TeamTimelineItem[];
};

export function TeamTimeline({ items }: TeamTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No matching plans or report entries for the selected filters.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{item.title}</span>
                <Badge variant={item.kind === "report" ? "default" : "secondary"}>
                  {item.kind === "report" ? "Report" : "Plan"}
                </Badge>
                <Badge variant="outline">{periodTypeLabel(item.periodType)}</Badge>
                <VisibilityBadge visibility={item.visibility} />
                {item.kind === "plan" && item.completed && (
                  <Badge variant="outline">Completed</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {item.ownerName} ·{" "}
                {formatPeriodLabel(
                  item.periodType,
                  item.periodStart,
                  item.periodEnd,
                )}
              </p>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              {item.kind === "report" ? (
                <span className="font-medium tabular-nums">
                  {item.hours.toFixed(1)} h
                </span>
              ) : (
                <span className="text-muted-foreground">Planned</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
