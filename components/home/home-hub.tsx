"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  openOrCreatePlanAction,
  openOrCreateReportAction,
  setHomeDayAction,
  setHomeMonthAction,
  setHomeWeekAction,
} from "@/app/(dashboard)/home-actions";
import { FilingActionButton } from "@/components/filing/filing-action-button";
import { FilingSection } from "@/components/filing/filing-section";
import { FilingStatusStrip } from "@/components/filing/filing-status-strip";
import { useDictionary } from "@/components/i18n-provider";
import { WeekPicker } from "@/components/plans/week-picker";
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
import {
  planHomeActionMeta,
  reportHomeActionMeta,
} from "@/lib/filing/action-meta";
import { periodFilingAccentClass } from "@/lib/filing/status";
import { formatMessage } from "@/lib/i18n/format";
import { periodTypeLabel } from "@/lib/i18n/period-labels";
import { cn } from "@/lib/utils";

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

type PendingAction = "plan" | "report" | null;

function PeriodSection({
  section,
  picker,
}: {
  section: HomePeriodSectionData;
  picker: React.ReactNode;
}) {
  const dict = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    if (!isPending) {
      setPendingAction(null);
    }
  }, [isPending]);

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
    setPendingAction("plan");
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
    setPendingAction("report");
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

  const planMeta = planHomeActionMeta(section.plan, section.editable, dict);
  const reportMeta = reportHomeActionMeta(section.report, section.editable, dict);

  const showPlanAction = canSubmitOrEditPlan || canViewPlan;
  const showReportAction =
    canSubmitOrEditReport || canViewReport || (section.editable && planSubmitted);

  return (
    <Card
      data-testid={`home-section-${section.type.toLowerCase()}`}
      className={cn(
        "flex h-full min-w-0 flex-col",
        periodFilingAccentClass(section.plan, section.report, section.editable),
      )}
    >
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <CardTitle>{periodTypeLabel(section.type, dict)}</CardTitle>
          <CardDescription className="line-clamp-2">
            {section.periodLabel}
          </CardDescription>
        </div>
        <FilingStatusStrip plan={section.plan} report={section.report} />
        {picker}
        {!section.editable ? (
          <p className="text-xs text-muted-foreground">
            {dict.home.outsideEditWindow}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid flex-1 gap-3">
          <FilingSection title={dict.common.plan}>
            {section.plan ? (
              <>
                <p className="text-muted-foreground">
                  {formatMessage(dict.home.itemsCompleted, {
                    completed: section.plan.completedCount,
                    total: section.plan.itemCount,
                  })}
                </p>
                {section.plan.itemPreviews.length > 0 ? (
                  <ul className="list-inside list-disc text-muted-foreground">
                    {section.plan.itemPreviews.map((item) => (
                      <li key={item.id} className="truncate">
                        {item.title}
                      </li>
                    ))}
                    {section.plan.itemCount > section.plan.itemPreviews.length ? (
                      <li>…</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{dict.home.noItemsYet}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">{dict.home.noPlanFiled}</p>
            )}
            {showPlanAction ? (
              <FilingActionButton
                kind="plan"
                meta={planMeta}
                disabled={isPending}
                onClick={openPlan}
                pendingLabel={
                  pendingAction === "plan" && isPending
                    ? dict.home.openingPlan
                    : undefined
                }
              />
            ) : null}
          </FilingSection>
          <FilingSection title={dict.common.report}>
            {section.report ? (
              <>
                <p className="text-muted-foreground">
                  {section.report.entryCount === 1
                    ? formatMessage(dict.home.entryCountOne, {
                        count: section.report.entryCount,
                      })
                    : formatMessage(dict.home.entryCountMany, {
                        count: section.report.entryCount,
                      })}{" "}
                  ·{" "}
                  {formatMessage(dict.home.hoursShort, {
                    hours: section.report.totalHours.toFixed(1),
                  })}
                </p>
                {section.report.entryPreviews.length > 0 ? (
                  <ul className="list-inside list-disc text-muted-foreground">
                    {section.report.entryPreviews.map((entry) => (
                      <li key={entry.id} className="truncate">
                        {entry.title}
                      </li>
                    ))}
                    {section.report.entryCount >
                    section.report.entryPreviews.length ? (
                      <li>…</li>
                    ) : null}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">{dict.home.noReportFiled}</p>
            )}
            {showReportAction ? (
              <FilingActionButton
                kind="report"
                meta={reportMeta}
                disabled={isPending}
                onClick={openReport}
                pendingLabel={
                  pendingAction === "report" && isPending
                    ? dict.home.openingReport
                    : undefined
                }
              />
            ) : null}
          </FilingSection>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function MonthPicker({ value }: { value: string }) {
  const dict = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="home-month">{dict.periods.picker.month}</Label>
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
  const dict = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="home-day">{dict.periods.picker.day}</Label>
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
