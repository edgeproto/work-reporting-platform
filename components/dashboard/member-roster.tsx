"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";

import { PeriodType } from "@/app/generated/prisma/enums";
import { VisibilityBadge, PlanItemOutcomeBadge } from "@/components/plans/plan-badges";
import { PlanItemOutcome } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
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
  RosterPlanLine,
  RosterReportLine,
} from "@/lib/dashboard/types";
import {
  monthInputToReferenceDate,
  periodTypeLabel,
  pickerValueFromReferenceDate,
} from "@/lib/periods";

const INITIAL_LINES = 4;

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

function FilingTimestampFooter({
  timestamps,
  show,
}: {
  timestamps: FilingTimestamps | null;
  show: boolean;
}) {
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
      {submitted ? <p>Submitted {submitted}</p> : null}
      {changedAfterSubmit ? <p>Last changed {updated}</p> : null}
    </div>
  );
}

function LineList<T extends RosterPlanLine | RosterReportLine>({
  lines,
  expanded,
  renderLine,
  emptyLabel,
}: {
  lines: T[];
  expanded: boolean;
  renderLine: (line: T, index: number) => React.ReactNode;
  emptyLabel: string;
}) {
  if (lines.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }

  const visible = expanded ? lines : lines.slice(0, INITIAL_LINES);
  const hasMore = lines.length > INITIAL_LINES;

  return (
    <div className="space-y-1">
      <ul className="space-y-1">{visible.map((line, i) => renderLine(line, i))}</ul>
      {!expanded && hasMore ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MoreHorizontal className="size-3.5" aria-hidden />
          <span>{lines.length - INITIAL_LINES} more</span>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardFiltersForm({ filters }: { filters: DashboardFilters }) {
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
        <Label htmlFor="dash-type">Type</Label>
        <select
          id="dash-type"
          value={periodType}
          disabled={isPending}
          onChange={(e) => handleTypeChange(e.target.value as PeriodType)}
          className="flex h-8 min-w-32 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {Object.values(PeriodType).map((type) => (
            <option key={type} value={type}>
              {periodTypeLabel(type)}
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
            {periodType === PeriodType.MONTHLY ? "Month" : "Date"}
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
  const qs = buildParams(filters);
  const [expandAll, setExpandAll] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const anyExpandable = useMemo(
    () =>
      rows.some(
        (row) =>
          row.planLines.length > INITIAL_LINES ||
          row.reportLines.length > INITIAL_LINES,
      ),
    [rows],
  );

  const isRowExpanded = (rowId: string) =>
    expandAll || expandedRows.has(rowId);

  const toggleRow = (rowId: string) => {
    if (expandAll) {
      setExpandAll(false);
      setExpandedRows(new Set(rows.map((r) => r.id).filter((id) => id !== rowId)));
      return;
    }
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {anyExpandable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setExpandAll(true);
              setExpandedRows(new Set());
            }}
          >
            Expand all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setExpandAll(false);
              setExpandedRows(new Set());
            }}
          >
            Collapse all
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-3" aria-label="Expand row" />
              <th className="px-4 py-3 font-medium">
                <SortHeader label="Name" sortKey="name" filters={filters} />
              </th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="min-w-48 px-4 py-3 font-medium">Plan</th>
              <th className="min-w-48 px-4 py-3 font-medium">Report</th>
              <th className="px-4 py-3 font-medium">
                <SortHeader
                  label="Plan complete %"
                  sortKey="completion"
                  filters={filters}
                />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortHeader label="Hours" sortKey="hours" filters={filters} />
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
                  No active members in this organization.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expanded = isRowExpanded(row.id);
                const canExpand =
                  row.planLines.length > INITIAL_LINES ||
                  row.reportLines.length > INITIAL_LINES;

                return (
                  <tr key={row.id} className="align-top hover:bg-muted/30">
                    <td className="px-2 py-3">
                      {canExpand ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => toggleRow(row.id)}
                          aria-label={expanded ? "Collapse row" : "Expand row"}
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </Button>
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
                      <LineList
                        lines={row.planLines}
                        expanded={expanded}
                        emptyLabel="No plan filed."
                        renderLine={(line, index) => (
                          <li
                            key={`${line.title}-${index}`}
                            className="flex flex-wrap items-center gap-1.5"
                          >
                            <span className="truncate">{line.title}</span>
                            <VisibilityBadge visibility={line.visibility} />
                            {line.outcome !== PlanItemOutcome.OPEN ? (
                              <PlanItemOutcomeBadge outcome={line.outcome} />
                            ) : null}
                          </li>
                        )}
                      />
                      <FilingTimestampFooter
                        timestamps={row.planTimestamps}
                        show={showChangeTimestamps}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <LineList
                        lines={row.reportLines}
                        expanded={expanded}
                        emptyLabel="No report filed."
                        renderLine={(line, index) => (
                          <li
                            key={`${line.title}-${index}`}
                            className="flex flex-wrap items-center gap-1.5"
                          >
                            <span className="truncate">{line.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {line.hours.toFixed(1)} h
                            </span>
                            <VisibilityBadge visibility={line.visibility} />
                          </li>
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
