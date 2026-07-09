"use client";

import { useMemo } from "react";

import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import {
  ExpandableLineList,
  ExpandAllToggleButton,
  ExpandMoreButton,
  itemHasMoreLines,
  useExpandableItems,
} from "@/components/feed/expandable-lines";
import { FilingActionLink } from "@/components/filing/filing-action-link";
import { FilingSection } from "@/components/filing/filing-section";
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
import {
  planViewActionMeta,
  reportViewActionMeta,
} from "@/lib/filing/action-meta";
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
  const planAction = planViewActionMeta(card.plan, dict);
  const reportAction = reportViewActionMeta(card.report, dict);

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
      <CardContent className="grid gap-3 text-sm">
        {card.plan ? (
          <FilingSection title={dict.common.plan}>
            {card.plan.lines.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatMessage(dict.feed.completed, {
                  completed: card.plan.completedCount,
                  total: card.plan.lines.length,
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{dict.feed.noPlanItems}</p>
            )}
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
            {planAction ? (
              <FilingActionLink
                href={`/my-plans/${card.plan.id}`}
                kind="plan"
                meta={planAction}
              />
            ) : null}
          </FilingSection>
        ) : (
          <FilingSection title={dict.common.plan}>
            <p className="text-xs text-muted-foreground">{dict.feed.noPlanItems}</p>
          </FilingSection>
        )}

        {card.report ? (
          <FilingSection title={dict.common.report}>
            {card.report.lines.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatMessage(dict.feed.hoursShort, {
                  hours: card.report.totalHours.toFixed(1),
                })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {dict.feed.noReportEntries}
              </p>
            )}
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
            {reportAction ? (
              <FilingActionLink
                href={`/my-reports/${card.report.id}`}
                kind="report"
                meta={reportAction}
              />
            ) : null}
          </FilingSection>
        ) : (
          <FilingSection title={dict.common.report}>
            <p className="text-xs text-muted-foreground">
              {dict.feed.noReportEntries}
            </p>
          </FilingSection>
        )}
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
