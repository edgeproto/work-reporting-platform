"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { PeriodType, PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  FilingMissingBadge,
  PlanItemOutcomeBadge,
  PlanStatusBadge,
  VisibilityBadge,
} from "@/components/plans/plan-badges";
import { ReportStatusBadge } from "@/components/reports/report-badges";
import {
  ExpandableLineList,
  ExpandAllToggleButton,
  ExpandMoreButton,
  itemHasMoreLines,
  useExpandableItems,
} from "@/components/feed/expandable-lines";
import { useDictionary } from "@/components/i18n-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeekPicker } from "@/components/plans/week-picker";
import {
  dashboardFiltersToSearchParams,
  type DashboardFilters,
  type DashboardSortDir,
  type DashboardSortKey,
} from "@/lib/dashboard/filters";
import { formatDashboardTimestamp } from "@/lib/dashboard/period";
import type {
  FilingTimestamps,
  MemberRosterRow,
} from "@/lib/dashboard/types";
import { filingStatusFromTimestamps } from "@/lib/filing/status";
import { formatMessage } from "@/lib/i18n/format";
import { periodPickerLabel, periodTypeLabel } from "@/lib/i18n/period-labels";
import {
  monthInputToReferenceDate,
  pickerValueFromReferenceDate,
} from "@/lib/periods";

type MemberRosterProps = {
  rows: MemberRosterRow[];
  filters: DashboardFilters;
  roleLabels: Record<string, string>;
  showChangeTimestamps: boolean;
};

function buildParams(
  filters: DashboardFilters,
  overrides: Partial<{
    type: PeriodType;
    date: string;
    sort: DashboardSortKey;
    dir: DashboardSortDir;
  }> = {},
): string {
  const next: DashboardFilters = {
    ...filters,
    periodType: overrides.type ?? filters.periodType,
    referenceDate: overrides.date ?? filters.referenceDate,
    sort: overrides.sort ?? filters.sort,
    dir: overrides.dir ?? filters.dir,
  };
  const qs = dashboardFiltersToSearchParams(next).toString();
  return qs ? `?${qs}` : "";
}

function SortHeader({
  label,
  sortKey,
  filters,
}: {
  label: string;
  sortKey: DashboardSortKey;
  filters: DashboardFilters;
}) {
  const active = filters.sort === sortKey;
  const nextDir: DashboardSortDir =
    active && filters.dir === "asc" ? "desc" : "asc";
  const href = `/dashboard${buildParams(filters, {
    sort: sortKey,
    dir: active ? nextDir : sortKey === "name" ? "asc" : "desc",
  })}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 hover:underline"
    >
      {label}
      {active ? (
        <span aria-hidden className="text-xs">
          {filters.dir === "asc" ? "↑" : "↓"}
        </span>
      ) : null}
    </Link>
  );
}

function RosterFilingBadge({
  timestamps,
  kind,
}: {
  timestamps: FilingTimestamps | null;
  kind: "plan" | "report";
}) {
  const status = filingStatusFromTimestamps(timestamps);
  if (status === "missing") {
    return <FilingMissingBadge />;
  }
  const submissionStatus =
    status === "submitted"
      ? SubmissionStatus.SUBMITTED
      : SubmissionStatus.DRAFT;
  return kind === "plan" ? (
    <PlanStatusBadge status={submissionStatus} />
  ) : (
    <ReportStatusBadge status={submissionStatus} />
  );
}

function FilingTimestampFooter({
  timestamps,
  show,
}: {
  timestamps: FilingTimestamps | null;
  show: boolean;
}) {
  const dict = useDictionary();

  if (!show || !timestamps) {
    return null;
  }

  const submittedAt = timestamps.submittedAt;
  const submitted = submittedAt
    ? formatDashboardTimestamp(submittedAt)
    : null;
  const updated = formatDashboardTimestamp(timestamps.updatedAt);
  const changedAfterSubmit =
    submittedAt != null &&
    new Date(timestamps.updatedAt).getTime() >
      new Date(submittedAt).getTime() + 1000;

  return (
    <div className="mt-2 space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
      {submitted ? (
        <p>
          {formatMessage(dict.dashboard.submittedAt, { timestamp: submitted })}
        </p>
      ) : null}
      {changedAfterSubmit ? (
        <p>
          {formatMessage(dict.dashboard.lastChangedAt, { timestamp: updated })}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardFiltersForm({ filters }: { filters: DashboardFilters }) {
  const dict = useDictionary();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [periodType, setPeriodType] = useState(filters.periodType);
  const [referenceDate, setReferenceDate] = useState(filters.referenceDate);
  const [pickerValue, setPickerValue] = useState(() =>
    pickerValueFromReferenceDate(filters.periodType, filters.referenceDate),
  );

  const apply = (type: PeriodType, date: string) => {
    startTransition(() => {
      router.push(`/dashboard${buildParams(filters, { type, date })}`);
    });
  };

  const handleTypeChange = (type: PeriodType) => {
    const nextPicker = pickerValueFromReferenceDate(type, referenceDate);
    const nextDate =
      type === PeriodType.MONTHLY
        ? monthInputToReferenceDate(nextPicker)
        : nextPicker;
    setPeriodType(type);
    setPickerValue(nextPicker);
    setReferenceDate(nextDate);
    apply(type, nextDate);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="dash-type">{dict.dashboard.filtersType}</Label>
        <select
          id="dash-type"
          value={periodType}
          disabled={isPending}
          onChange={(e) => handleTypeChange(e.target.value as PeriodType)}
          className="flex h-8 min-w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {Object.values(PeriodType).map((type) => (
            <option key={type} value={type}>
              {periodTypeLabel(type, dict)}
            </option>
          ))}
        </select>
      </div>

      {periodType === PeriodType.WEEKLY ? (
        <WeekPicker
          id="dash-week"
          value={pickerValue}
          onChange={(sunday) => {
            setPickerValue(sunday);
            setReferenceDate(sunday);
            apply(periodType, sunday);
          }}
        />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="dash-period">
            {periodPickerLabel(periodType, dict)}
          </Label>
          <Input
            id="dash-period"
            type={periodType === PeriodType.MONTHLY ? "month" : "date"}
            value={pickerValue}
            disabled={isPending}
            className="w-40"
            onChange={(e) => {
              const value = e.target.value;
              const date =
                periodType === PeriodType.MONTHLY
                  ? monthInputToReferenceDate(value)
                  : value;
              setPickerValue(value);
              setReferenceDate(date);
              apply(periodType, date);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function MemberRosterTable({
  rows,
  filters,
  roleLabels,
  showChangeTimestamps,
}: MemberRosterProps) {
  const dict = useDictionary();
  const qs = buildParams(filters);
  const rowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const { expandAll, isExpanded, toggleItem, toggleExpandAll } =
    useExpandableItems(rowIds);

  const anyExpandable = useMemo(
    () =>
      rows.some((row) =>
        itemHasMoreLines(row.planLines.length, row.reportLines.length),
      ),
    [rows],
  );

  return (
    <div className="space-y-3">
      {anyExpandable ? (
        <ExpandAllToggleButton
          expandAll={expandAll}
          onToggle={toggleExpandAll}
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-3" aria-label={dict.common.expandAll} />
              <th className="px-4 py-3 font-medium">
                <SortHeader
                  label={dict.dashboard.tableName}
                  sortKey="name"
                  filters={filters}
                />
              </th>
              <th className="px-4 py-3 font-medium">{dict.dashboard.tableRole}</th>
              <th className="min-w-48 px-4 py-3 font-medium">
                {dict.dashboard.tablePlan}
              </th>
              <th className="min-w-48 px-4 py-3 font-medium">
                {dict.dashboard.tableReport}
              </th>
              <th className="px-4 py-3 font-medium">
                <SortHeader
                  label={dict.dashboard.tablePlanComplete}
                  sortKey="completion"
                  filters={filters}
                />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortHeader
                  label={dict.dashboard.tableHours}
                  sortKey="hours"
                  filters={filters}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {dict.dashboard.noMembers}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expanded = isExpanded(row.id);
                const canExpand = itemHasMoreLines(
                  row.planLines.length,
                  row.reportLines.length,
                );

                return (
                  <tr key={row.id} className="align-top hover:bg-muted/30">
                    <td className="px-2 py-3">
                      {canExpand ? (
                        <ExpandMoreButton
                          expanded={expanded}
                          onToggle={() => toggleItem(row.id)}
                          label={row.name}
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/${row.id}${qs}`}
                        className="font-medium hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {roleLabels[row.role] ?? row.role}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mb-2">
                        <RosterFilingBadge
                          timestamps={row.planTimestamps}
                          kind="plan"
                        />
                      </div>
                      <ExpandableLineList
                        lines={row.planLines}
                        expanded={expanded}
                        emptyLabel={dict.dashboard.noPlanFiled}
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
                      <FilingTimestampFooter
                        timestamps={row.planTimestamps}
                        show={showChangeTimestamps}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mb-2">
                        <RosterFilingBadge
                          timestamps={row.reportTimestamps}
                          kind="report"
                        />
                      </div>
                      <ExpandableLineList
                        lines={row.reportLines}
                        expanded={expanded}
                        emptyLabel={dict.dashboard.noReportFiled}
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
                      <FilingTimestampFooter
                        timestamps={row.reportTimestamps}
                        show={showChangeTimestamps}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.completionPct == null
                        ? "—"
                        : `${row.completionPct.toFixed(1)}%`}
                      {row.planItemCount > 0 ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({row.completedCount}/{row.planItemCount})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{row.hours.toFixed(1)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
