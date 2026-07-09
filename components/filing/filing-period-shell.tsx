"use client";

import Link from "next/link";

import { PeriodType } from "@/app/generated/prisma/enums";
import { FilingStatusStrip } from "@/components/filing/filing-status-strip";
import { useDictionary, useI18n } from "@/components/i18n-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  feedCardAccentClass,
  periodFilingAccentClass,
} from "@/lib/filing/status";
import { periodTypeLabel } from "@/lib/i18n/period-labels";
import { formatPeriodLabel } from "@/lib/periods";
import { cn } from "@/lib/utils";

type FilingPeriodShellProps = {
  backHref?: string;
  backLabel?: string;
  mode?: "editor" | "viewer";
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  periodEditable?: boolean;
  plan: { status: string } | null;
  report: { status: string } | null;
  activeFiling?: "plan" | "report";
  heading?: string;
  subheading?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function FilingPeriodShell({
  backHref = "/",
  backLabel,
  mode = "editor",
  periodType,
  periodStart,
  periodEnd,
  periodEditable = true,
  plan,
  report,
  activeFiling,
  heading,
  subheading,
  headerActions,
  children,
}: FilingPeriodShellProps) {
  const dict = useDictionary();
  const { locale } = useI18n();
  const periodLabel = formatPeriodLabel(
    periodType,
    new Date(periodStart),
    new Date(periodEnd),
    undefined,
    locale,
    dict.periods,
  );
  const title = heading ?? periodTypeLabel(periodType, dict);
  const description = subheading ?? periodLabel;
  const accentClass =
    mode === "viewer"
      ? feedCardAccentClass(plan, report)
      : periodFilingAccentClass(plan, report, periodEditable);
  const editingLabel =
    activeFiling === "plan"
      ? dict.navEditor.editingPlan
      : activeFiling === "report"
        ? dict.navEditor.editingReport
        : null;
  const resolvedBackLabel = backLabel ?? dict.navEditor.backToHome;

  return (
    <Card className={cn("flex min-w-0 flex-col", accentClass)}>
      <CardHeader className="space-y-3">
        <Link
          href={backHref}
          className="inline-flex h-7 w-fit items-center rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {resolvedBackLabel}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {mode === "editor" && editingLabel ? (
              <p className="text-sm font-medium text-foreground">{editingLabel}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
          ) : null}
        </div>
        <FilingStatusStrip
          plan={plan}
          report={report}
          activeFiling={activeFiling}
        />
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
