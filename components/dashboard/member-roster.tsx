"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type {
  DashboardFilters,
  DashboardSortDir,
  DashboardSortKey,
  MemberRosterRow,
} from "@/lib/dashboard/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MemberRosterProps = {
  rows: MemberRosterRow[];
  filters: DashboardFilters;
  roleLabels: Record<string, string>;
};

function buildParams(
  filters: DashboardFilters,
  overrides: Partial<{
    range: string;
    from: string;
    to: string;
    sort: DashboardSortKey;
    dir: DashboardSortDir;
  }> = {},
): string {
  const params = new URLSearchParams();
  const range = overrides.range ?? filters.rangePreset;
  if (range !== "week") {
    params.set("range", range);
  }
  if ((overrides.range ?? filters.rangePreset) === "custom") {
    const from =
      overrides.from ??
      filters.dateFrom.toISOString().slice(0, 10);
    const to = overrides.to ?? filters.dateTo.toISOString().slice(0, 10);
    params.set("from", from);
    params.set("to", to);
  }
  const sort = overrides.sort ?? filters.sort;
  const dir = overrides.dir ?? filters.dir;
  if (sort !== "name") {
    params.set("sort", sort);
  }
  if (!(sort === "name" && dir === "asc")) {
    params.set("dir", dir);
  }
  const qs = params.toString();
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

export function DashboardFiltersForm({ filters }: { filters: DashboardFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const range = String(form.get("range") || "week");
        const from = String(form.get("from") || "");
        const to = String(form.get("to") || "");
        startTransition(() => {
          router.push(
            `/dashboard${buildParams(filters, {
              range,
              from,
              to,
            })}`,
          );
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="dash-range">Range</Label>
        <select
          id="dash-range"
          name="range"
          defaultValue={filters.rangePreset}
          className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dash-from">From</Label>
        <Input
          id="dash-from"
          name="from"
          type="date"
          defaultValue={filters.dateFrom.toISOString().slice(0, 10)}
          className="w-36"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dash-to">To</Label>
        <Input
          id="dash-to"
          name="to"
          type="date"
          defaultValue={filters.dateTo.toISOString().slice(0, 10)}
          className="w-36"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating…" : "Apply"}
      </Button>
    </form>
  );
}

export function MemberRosterTable({
  rows,
  filters,
  roleLabels,
}: MemberRosterProps) {
  const qs = buildParams(filters);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="border-b bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">
              <SortHeader label="Name" sortKey="name" filters={filters} />
            </th>
            <th className="px-4 py-3 font-medium">Role</th>
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
                colSpan={4}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No active members in this organization.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
