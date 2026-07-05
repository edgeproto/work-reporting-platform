import Link from "next/link";

import {
  PeriodType,
  Visibility,
} from "@/app/generated/prisma/enums";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { periodTypeLabel } from "@/lib/periods";
import type { TeamFilters } from "@/lib/team/filters";
import { cn } from "@/lib/utils";

type MemberOption = {
  id: string;
  name: string;
};

type TaskTitleOption = {
  id: string;
  title: string;
};

type TeamFiltersProps = {
  filters: TeamFilters;
  members: MemberOption[];
  taskTitles: TaskTitleOption[];
  managerView: boolean;
};

export function TeamFiltersForm({
  filters,
  members,
  taskTitles,
  managerView,
}: TeamFiltersProps) {
  const customRange = filters.rangePreset === "custom";

  return (
    <form
      method="get"
      className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <FilterField label="Date range">
        <select
          name="range"
          defaultValue={filters.rangePreset}
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="custom">Custom range</option>
          <option value="all">All time</option>
        </select>
      </FilterField>

      {customRange && (
        <>
          <FilterField label="From">
            <Input
              type="date"
              name="from"
              defaultValue={filters.dateFrom?.toISOString().slice(0, 10) ?? ""}
              className="h-8"
            />
          </FilterField>
          <FilterField label="To">
            <Input
              type="date"
              name="to"
              defaultValue={filters.dateTo?.toISOString().slice(0, 10) ?? ""}
              className="h-8"
            />
          </FilterField>
        </>
      )}

      <FilterField label="Member">
        <select
          name="member"
          defaultValue={filters.memberId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="">All members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Period type">
        <select
          name="type"
          defaultValue={filters.periodType ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="">All types</option>
          {Object.values(PeriodType).map((type) => (
            <option key={type} value={type}>
              {periodTypeLabel(type)}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField label="Show">
        <select
          name="view"
          defaultValue={filters.view}
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="all">Plans & reports</option>
          <option value="reports">Reports only</option>
          <option value="plans">Plans only</option>
        </select>
      </FilterField>

      <FilterField label="Task title">
        <select
          name="task"
          defaultValue={filters.taskTitleId ?? ""}
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="">All tasks</option>
          {taskTitles.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </FilterField>

      {managerView && (
        <FilterField label="Visibility">
          <select
            name="visibility"
            defaultValue={filters.visibility ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="">Public & private</option>
            <option value={Visibility.PUBLIC}>Public only</option>
            <option value={Visibility.PRIVATE}>Private only</option>
          </select>
        </FilterField>
      )}

      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        <Link
          href="/team"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Reset
        </Link>
      </div>
    </form>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
