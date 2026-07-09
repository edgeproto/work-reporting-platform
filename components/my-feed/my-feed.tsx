"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import {
  ExpandableLineList,
  ExpandAllToggleButton,
  ExpandMoreButton,
  itemHasMoreLines,
  useExpandableItems,
} from "@/components/feed/expandable-lines";
import { FilingStatusStrip } from "@/components/filing/filing-status-strip";
import { useDictionary } from "@/components/i18n-provider";
import { PlanItemOutcomeBadge, VisibilityBadge } from "@/components/plans/plan-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { feedCardAccentClass } from "@/lib/filing/status";
import { formatMessage } from "@/lib/i18n/format";
import type { FeedPeriodCard, MyFeedData } from "@/lib/my-feed/types";
import { cn } from "@/lib/utils";

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
  const dict = useDictionary();
  const planLineCount = card.plan?.lines.length ?? 0;
  const reportLineCount = card.report?.lines.length ?? 0;
  const canExpand = itemHasMoreLines(planLineCount, reportLineCount);

  return (
    <Card className={cn(feedCardAccentClass(card.plan, card.report))}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{card.heading}</CardTitle>
            <CardDescription className="text-xs">{card.periodLabel}</CardDescription>
          </div>
          <FilingStatusStrip plan={card.plan} report={card.report} />
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {dict.common.plan}
          </p>
          {card.plan ? (
            <div className="space-y-2">
              {card.plan.lines.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {formatMessage(dict.feed.completed, {
                    completed: card.plan.completedCount,
                    total: card.plan.lines.length,
                  })}
                </p>
              ) : null}
              <ExpandableLineList
                lines={card.plan.lines}
                expanded={expanded}
                emptyLabel={dict.feed.noPlanItems}
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
                {dict.feed.openPlan}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {dict.common.report}
          </p>
          {card.report ? (
            <div className="space-y-2">
              {card.report.lines.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {formatMessage(dict.feed.hoursShort, {
                    hours: card.report.totalHours.toFixed(1),
                  })}
                </p>
              ) : null}
              <ExpandableLineList
                lines={card.report.lines}
                expanded={expanded}
                emptyLabel={dict.feed.noReportEntries}
                lineKey={(line, index) => `${line.title}-${index}`}
                renderLine={(line) => (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate">{line.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessage(dict.feed.hoursShort, {
                        hours: line.hours.toFixed(1),
                      })}
                    </span>
                    <VisibilityBadge visibility={line.visibility} />
                  </div>
                )}
              />
              <Link
                href={`/my-reports/${card.report.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {dict.feed.openReport}
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
  const dict = useDictionary();
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
            <h2 className="text-lg font-medium">{dict.feed.dailyTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {dict.feed.dailyDescription}
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
            <h2 className="text-lg font-medium">{dict.feed.weeklyTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {dict.feed.weeklyDescription}
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
