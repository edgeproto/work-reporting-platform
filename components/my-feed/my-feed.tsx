"use client";

import Link from "next/link";

import { SubmissionStatus } from "@/app/generated/prisma/enums";
import { PlanStatusBadge } from "@/components/plans/plan-badges";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeedPeriodCard, MyFeedData } from "@/lib/my-feed/queries";

function MissingBadge() {
  return <Badge variant="outline">Missing</Badge>;
}

function FeedCard({ card }: { card: FeedPeriodCard }) {
  return (
    <Card className="min-w-[220px] shrink-0">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base">{card.heading}</CardTitle>
        <CardDescription className="text-xs">{card.periodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Plan
          </p>
          {card.plan ? (
            <div className="space-y-1">
              <PlanStatusBadge
                status={
                  card.plan.status === "submitted"
                    ? SubmissionStatus.SUBMITTED
                    : SubmissionStatus.DRAFT
                }
              />
              <p className="text-muted-foreground">{card.plan.summary}</p>
              <Link
                href={`/my-plans/${card.plan.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open plan
              </Link>
            </div>
          ) : (
            <MissingBadge />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Report
          </p>
          {card.report ? (
            <div className="space-y-1">
              <ReportStatusBadge
                status={
                  card.report.status === "submitted"
                    ? SubmissionStatus.SUBMITTED
                    : SubmissionStatus.DRAFT
                }
              />
              <p className="text-muted-foreground">{card.report.summary}</p>
              <Link
                href={`/my-reports/${card.report.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Open report
              </Link>
            </div>
          ) : (
            <MissingBadge />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FeedStrip({
  title,
  description,
  cards,
}: {
  title: string;
  description: string;
  cards: FeedPeriodCard[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {cards.map((card) => (
          <FeedCard key={`${card.type}-${card.referenceDate}`} card={card} />
        ))}
      </div>
    </section>
  );
}

export function MyFeed({ data }: { data: MyFeedData }) {
  return (
    <div className="space-y-8">
      <FeedStrip
        title="Last 7 days"
        description="Daily plans and reports, including today."
        cards={data.daily}
      />
      <FeedStrip
        title="Last 4 weeks"
        description="Weekly plans and reports, including this week."
        cards={data.weekly}
      />
    </div>
  );
}
