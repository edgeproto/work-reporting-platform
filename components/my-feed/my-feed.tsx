"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  ExpandableLineList,
  ExpandAllToggleButton,
  ExpandMoreButton,
  itemHasMoreLines,
  useExpandableItems,
} from "@/components/feed/expandable-lines";
import { PlanItemOutcomeBadge, PlanStatusBadge, VisibilityBadge } from "@/components/plans/plan-badges";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeedPeriodCard, MyFeedData } from "@/lib/my-feed/types";

function MissingBadge() {
  return <Badge variant="outline">Missing</Badge>;
}

function feedCardId(card: FeedPeriodCard): string {
  return `${card.type}-${card.referenceDate}`;
}

function FeedCard({
  card,
  expanded,
  onToggleExpand,
}: {
  card: FeedPeriodCard;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const planLineCount = card.plan?.lines.length ?? 0;
  const reportLineCount = card.report?.lines.length ?? 0;
  const canExpand = itemHasMoreLines(planLineCount, reportLineCount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{card.heading}</CardTitle>
          <CardDescription className="text-xs">{card.periodLabel}</CardDescription>
        </div>
        {canExpand ? (
          <ExpandMoreButton
            expanded={expanded}
            onToggle={onToggleExpand}
            label={card.heading}
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan
            </p>
            {card.plan ? (
              <>
                <PlanStatusBadge
                  status={
                    card.plan.status === "submitted"
                      ? SubmissionStatus.SUBMITTED
                      : SubmissionStatus.DRAFT
                  }
                />
                {card.plan.lines.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {card.plan.completedCount}/{card.plan.lines.length} completed
                  </span>
                ) : null}
              </>
            ) : (
              <MissingBadge />
            )}
          </div>
          {card.plan ? (
            <div className="space-y-2">
              <ExpandableLineList
                lines={card.plan.lines}
                expanded={expanded}
                emptyLabel="No plan items."
                lineKey={(line, index) => `${line.title}-${index}`}
                renderLine={(line) => (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate">{line.title}</span>
                    <VisibilityBadge visibility={line.visibility} />
                    {line.outcome !== PlanItemOutcome.OPEN ? (
                      <PlanItemOutcomeBadge outcome={line.outcome} />
                    ) : null}
                  </div>
                )}
              />
              <Link
                href={`/my-plans/${card.plan.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open plan
              </Link>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Report
            </p>
            {card.report ? (
              <>
                <ReportStatusBadge
                  status={
                    card.report.status === "submitted"
                      ? SubmissionStatus.SUBMITTED
                      : SubmissionStatus.DRAFT
                  }
                />
                {card.report.lines.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {card.report.totalHours.toFixed(1)} h
                  </span>
                ) : null}
              </>
            ) : (
              <MissingBadge />
            )}
          </div>
          {card.report ? (
            <div className="space-y-2">
              <ExpandableLineList
                lines={card.report.lines}
                expanded={expanded}
                emptyLabel="No report entries."
                lineKey={(line, index) => `${line.title}-${index}`}
                renderLine={(line) => (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate">{line.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {line.hours.toFixed(1)} h
                    </span>
                    <VisibilityBadge visibility={line.visibility} />
                  </div>
                )}
              />
              <Link
                href={`/my-reports/${card.report.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open report
              </Link>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedColumn({
  cards,
  isExpanded,
  onToggleItem,
}: {
  cards: FeedPeriodCard[];
  isExpanded: (id: string) => boolean;
  onToggleItem: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {[...cards].reverse().map((card) => {
        const id = feedCardId(card);
        return (
          <FeedCard
            key={id}
            card={card}
            expanded={isExpanded(id)}
            onToggleExpand={() => onToggleItem(id)}
          />
        );
      })}
    </div>
  );
}

export function MyFeed({ data }: { data: MyFeedData }) {
  const allCards = useMemo(
    () => [...data.daily, ...data.weekly],
    [data.daily, data.weekly],
  );

  const expandableIds = useMemo(
    () =>
      allCards
        .filter((card) =>
          itemHasMoreLines(
            card.plan?.lines.length ?? 0,
            card.report?.lines.length ?? 0,
          ),
        )
        .map((card) => feedCardId(card)),
    [allCards],
  );

  const { expandAll, isExpanded, toggleItem, toggleExpandAll } =
    useExpandableItems(expandableIds);

  const showExpandAll = expandableIds.length > 0;

  return (
    <div className="space-y-4">
      {showExpandAll ? (
        <ExpandAllToggleButton
          expandAll={expandAll}
          onToggle={toggleExpandAll}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-medium">Last 7 days</h2>
            <p className="text-sm text-muted-foreground">
              Daily plans and reports, including today.
            </p>
          </div>
          <FeedColumn
            cards={data.daily}
            isExpanded={isExpanded}
            onToggleItem={toggleItem}
          />
        </section>

        <section className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-medium">Last 5 weeks</h2>
            <p className="text-sm text-muted-foreground">
              Weekly plans and reports, including this week.
            </p>
          </div>
          <FeedColumn
            cards={data.weekly}
            isExpanded={isExpanded}
            onToggleItem={toggleItem}
          />
        </section>
      </div>
    </div>
  );
}
