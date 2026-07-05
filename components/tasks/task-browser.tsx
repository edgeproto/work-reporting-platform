"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PeriodType } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeriodLabel, periodTypeLabel } from "@/lib/periods";
import type { SelectableReportTask } from "@/lib/tasks/queries";
import { cn } from "@/lib/utils";

export type SerializedSelectableTask = {
  id: string;
  title: string;
  description: string | null;
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  parentTitle: string | null;
  disabled: boolean;
  disabledReason?: string;
};

export function serializeSelectableTask(
  task: SelectableReportTask,
): SerializedSelectableTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    periodStart: task.periodStart.toISOString(),
    periodEnd: task.periodEnd.toISOString(),
    parentTitle: task.parentTitle,
    disabled: task.disabled,
    disabledReason: task.disabledReason,
  };
}

type TaskPickerProps = {
  tasks: SerializedSelectableTask[];
  selectedTaskId: string;
  onSelect: (taskId: string) => void;
  idPrefix?: string;
};

export function TaskPicker({
  tasks,
  selectedTaskId,
  onSelect,
  idPrefix = "task",
}: TaskPickerProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PeriodType | "ALL">("ALL");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (typeFilter !== "ALL" && task.type !== typeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.parentTitle?.toLowerCase().includes(query)
      );
    });
  }, [tasks, search, typeFilter]);

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet — create a new task below or add tasks from your plans.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-search`}>Search tasks</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${idPrefix}-search`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title…"
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <select
            id={`${idPrefix}-type`}
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as PeriodType | "ALL")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="ALL">All types</option>
            {Object.values(PeriodType).map((type) => (
              <option key={type} value={type}>
                {periodTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="max-h-56 divide-y overflow-y-auto rounded-lg border">
        {filtered.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            No tasks match your search.
          </li>
        ) : (
          filtered.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => !task.disabled && onSelect(task.id)}
                disabled={task.disabled}
                aria-pressed={selectedTaskId === task.id}
                className={cn(
                  "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
                  selectedTaskId === task.id && "bg-muted",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <Badge variant="outline">{periodTypeLabel(task.type)}</Badge>
                  {task.disabled && task.disabledReason ? (
                    <span className="text-xs text-muted-foreground">
                      {task.disabledReason}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatPeriodLabel(
                    task.type,
                    new Date(task.periodStart),
                    new Date(task.periodEnd),
                  )}
                </p>
                {task.parentTitle ? (
                  <p className="text-xs text-muted-foreground">
                    ↳ from {task.parentTitle}
                  </p>
                ) : null}
                {task.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

type TasksBrowserProps = {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    type: PeriodType;
    periodStart: string;
    periodEnd: string;
    parentTitle: string | null;
    childCount: number;
  }>;
};

export function TasksBrowser({ tasks }: TasksBrowserProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PeriodType | "ALL">("ALL");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (typeFilter !== "ALL" && task.type !== typeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.parentTitle?.toLowerCase().includes(query)
      );
    });
  }, [tasks, search, typeFilter]);

  const grouped = useMemo(() => {
    const groups: Record<PeriodType, typeof filtered> = {
      [PeriodType.MONTHLY]: [],
      [PeriodType.WEEKLY]: [],
      [PeriodType.DAILY]: [],
    };
    for (const task of filtered) {
      groups[task.type].push(task);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tasks-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tasks-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or description…"
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tasks-type">Type</Label>
          <select
            id="tasks-type"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as PeriodType | "ALL")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="ALL">All types</option>
            {Object.values(PeriodType).map((type) => (
              <option key={type} value={type}>
                {periodTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {tasks.length === 0
            ? "No tasks yet. Add tasks from your monthly, weekly, or daily plans."
            : "No tasks match your search."}
        </p>
      ) : (
        Object.values(PeriodType).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;

          return (
            <section key={type} className="space-y-3">
              <h2 className="text-lg font-medium">{periodTypeLabel(type)}</h2>
              <ul className="divide-y rounded-lg border">
                {items.map((task) => (
                  <li key={task.id} className="space-y-1 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline">{periodTypeLabel(task.type)}</Badge>
                      {task.parentTitle ? (
                        <span className="text-xs text-muted-foreground">
                          ↳ from {task.parentTitle}
                        </span>
                      ) : null}
                      {task.childCount > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {task.childCount} sub-task
                          {task.childCount === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriodLabel(
                        task.type,
                        new Date(task.periodStart),
                        new Date(task.periodEnd),
                      )}
                    </p>
                    {task.description ? (
                      <p className="text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
