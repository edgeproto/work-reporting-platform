"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  openOrCreatePlanAction,
  openOrCreateReportAction,
  setHomeDayAction,
  setHomeMonthAction,
  setHomeWeekAction,
} from "@/app/(dashboard)/home-actions";
import { WeekPicker } from "@/components/plans/week-picker";
import { PlanStatusBadge } from "@/components/plans/plan-badges";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HomePeriodSectionData } from "@/lib/home/queries";
import { periodTypeLabel } from "@/lib/periods";

type HomeHubProps = {
  monthly: HomePeriodSectionData;
  weekly: HomePeriodSectionData;
  daily: HomePeriodSectionData;
  prefs: {
    month: string;
    weekSunday: string;
    day: string;
  };
};

function MissingBadge() {
  return <Badge variant="outline">Missing</Badge>;
}

function FilingBadges({
  planStatus,
  reportStatus,
}: {
  planStatus: HomePeriodSectionData["plan"];
  reportStatus: HomePeriodSectionData["report"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        Plan
        {planStatus ? (
          <PlanStatusBadge
            status={
              planStatus.status === "submitted"
                ? SubmissionStatus.SUBMITTED
                : SubmissionStatus.DRAFT
            }
          />
        ) : (
          <MissingBadge />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        Report
        {reportStatus ? (
          <ReportStatusBadge
            status={
              reportStatus.status === "submitted"
                ? SubmissionStatus.SUBMITTED
                : SubmissionStatus.DRAFT
            }
          />
        ) : (
          <MissingBadge />
        )}
      </div>
    </div>
  );
}

function PeriodSection({
  section,
  picker,
}: {
  section: HomePeriodSectionData;
  picker: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const planMissing = !section.plan;
  const planDraft = section.plan?.status === "draft";
  const planSubmitted = section.plan?.status === "submitted";
  const reportMissing = !section.report;
  const reportDraft = section.report?.status === "draft";
  const reportSubmitted = section.report?.status === "submitted";

  const canSubmitOrEditPlan = section.editable && (planMissing || planDraft);
  const canViewPlan = !!section.plan;
  const canSubmitOrEditReport =
    section.editable &&
    (reportMissing || reportDraft) &&
    (planSubmitted || reportMissing || reportDraft);
  const canViewReport = !!section.report;

  const openPlan = () => {
    setError(null);
    startTransition(async () => {
      if (section.plan && !section.editable) {
        router.push(`/my-plans/${section.plan.id}`);
        return;
      }
      if (
        section.plan &&
        section.plan.status === "submitted" &&
        !canSubmitOrEditPlan
      ) {
        router.push(`/my-plans/${section.plan.id}`);
        return;
      }
      const result = await openOrCreatePlanAction(
        section.type,
        section.referenceDate,
      );
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const openReport = () => {
    setError(null);
    startTransition(async () => {
      if (section.report && !section.editable) {
        router.push(`/my-reports/${section.report.id}`);
        return;
      }
      if (section.report && reportSubmitted) {
        router.push(`/my-reports/${section.report.id}`);
        return;
      }
      const result = await openOrCreateReportAction(
        section.type,
        section.referenceDate,
      );
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const planButtonLabel = (() => {
    if (!section.editable && canViewPlan) {
      return "View plan";
    }
    if (planMissing) {
      return "Submit plan";
    }
    if (planDraft) {
      return "Edit plan";
    }
    return "View plan";
  })();

  const reportButtonLabel = (() => {
    if (!section.editable && canViewReport) {
      return "View report";
    }
    if (reportSubmitted) {
      return "View report";
    }
    if (reportMissing) {
      return "Submit report";
    }
    if (reportDraft) {
      return "Edit report";
    }
    return "View report";
  })();

  const showPlanAction = canSubmitOrEditPlan || canViewPlan;
  const showReportAction =
    canSubmitOrEditReport || canViewReport || (section.editable && planSubmitted);

  return (
    <Card
      data-testid={`home-section-${section.type.toLowerCase()}`}
      className="flex h-full min-w-0 flex-col"
    >
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle>{periodTypeLabel(section.type)}</CardTitle>
          <CardDescription className="line-clamp-2">
            {section.periodLabel}
          </CardDescription>
        </div>
        {picker}
        <FilingBadges planStatus={section.plan} reportStatus={section.report} />
        {!section.editable ? (
          <p className="text-xs text-muted-foreground">
            Outside the edit window — view only.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid flex-1 gap-4">
          <div className="space-y-1 text-sm">
            <p className="font-medium">Plan</p>
            {section.plan ? (
              <>
                <p className="text-muted-foreground">
                  {section.plan.completedCount}/{section.plan.itemCount} items
                  completed
                </p>
                {section.plan.itemTitles.length > 0 ? (
                  <ul className="list-inside list-disc text-muted-foreground">
                    {section.plan.itemTitles.map((title) => (
                      <li key={title} className="truncate">
                        {title}
                      </li>
                    ))}
                    {section.plan.itemCount > section.plan.itemTitles.length ? (
                      <li>…</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No items yet.</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No plan filed.</p>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">Report</p>
            {section.report ? (
              <>
                <p className="text-muted-foreground">
                  {section.report.entryCount} entr
                  {section.report.entryCount === 1 ? "y" : "ies"} ·{" "}
                  {section.report.totalHours.toFixed(1)} h
                </p>
                {section.report.entryTitles.length > 0 ? (
                  <ul className="list-inside list-disc text-muted-foreground">
                    {section.report.entryTitles.map((title) => (
                      <li key={title} className="truncate">
                        {title}
                      </li>
                    ))}
                    {section.report.entryCount >
                    section.report.entryTitles.length ? (
                      <li>…</li>
                    ) : null}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">No report filed.</p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {showPlanAction ? (
            <Button
              type="button"
              size="sm"
              variant={planSubmitted || !section.editable ? "outline" : "default"}
              disabled={isPending}
              onClick={openPlan}
            >
              {planButtonLabel}
            </Button>
          ) : null}
          {showReportAction ? (
            <Button
              type="button"
              size="sm"
              variant={
                reportSubmitted || !section.editable ? "outline" : "default"
              }
              disabled={isPending}
              onClick={openReport}
            >
              {reportButtonLabel}
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="home-month">Month</Label>
      <Input
        id="home-month"
        type="month"
        value={value}
        disabled={isPending}
        className="w-full max-w-40"
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            await setHomeMonthAction(next);
            router.refresh();
          });
        }}
      />
    </div>
  );
}

function DayPicker({ value }: { value: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="home-day">Day</Label>
      <Input
        id="home-day"
        type="date"
        value={value}
        disabled={isPending}
        className="w-full max-w-40"
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            await setHomeDayAction(next);
            router.refresh();
          });
        }}
      />
    </div>
  );
}

function WeekSectionPicker({ value }: { value: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <WeekPicker
      id="home-week"
      value={value}
      onChange={(sunday) => {
        startTransition(async () => {
          await setHomeWeekAction(sunday);
          router.refresh();
        });
      }}
    />
  );
}

export function HomeHub({ monthly, weekly, daily, prefs }: HomeHubProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <PeriodSection
        section={daily}
        picker={<DayPicker value={prefs.day} />}
      />
      <PeriodSection
        section={weekly}
        picker={<WeekSectionPicker value={prefs.weekSunday} />}
      />
      <PeriodSection
        section={monthly}
        picker={<MonthPicker value={prefs.month} />}
      />
    </div>
  );
}
