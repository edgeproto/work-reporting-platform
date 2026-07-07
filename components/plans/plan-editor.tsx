"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash2 } from "lucide-react";

import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  addPlanItemAction,
  deletePlanItemAction,
  reopenPlanAction,
  submitPlanAction,
} from "@/app/(dashboard)/my-plans/actions";
import { PlanStatusBadge, VisibilityBadge } from "@/components/plans/plan-badges";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatPeriodLabel, periodTypeLabel } from "@/lib/periods";
import type { SelectableParentTask } from "@/lib/tasks/queries";

export type SerializedPlanItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  completedAt: string | null;
  taskType: PeriodType | null;
  parentTitle: string | null;
};

export type SerializedPlan = {
  id: string;
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  periodPassed: boolean;
  items: SerializedPlanItem[];
};

type PlanEditorProps = {
  plan: SerializedPlan;
  selectableParents?: SelectableParentTask[];
};

export function PlanEditor({ plan, selectableParents = [] }: PlanEditorProps) {
  const router = useRouter();
  const isEditable = plan.status === SubmissionStatus.DRAFT && !plan.periodPassed;
  const periodLabel = formatPeriodLabel(
    plan.type,
    new Date(plan.periodStart),
    new Date(plan.periodEnd),
  );

  const addTaskDescription =
    plan.type === PeriodType.MONTHLY
      ? "Create monthly tasks for this plan. Tasks are private to you."
      : plan.type === PeriodType.WEEKLY
        ? "Add weekly tasks directly, or create sub-tasks from your monthly tasks for this month."
        : "Add daily tasks directly, or create sub-tasks from your weekly tasks for this week.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {periodTypeLabel(plan.type)} Plan
          </h1>
          <p className="text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanStatusBadge status={plan.status} />
          <DeletePlanButton planId={plan.id} variant="destructive" />
        </div>
      </div>

      {plan.periodPassed ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          This {plan.type.toLowerCase()} period has passed — tasks can no longer be added.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Planned tasks</CardTitle>
          <CardDescription>{addTaskDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No planned tasks yet. Add your first item below.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {plan.items.map((item) => (
                <PlanItemRow
                  key={item.id}
                  planId={plan.id}
                  item={item}
                  readOnly={!isEditable}
                />
              ))}
            </ul>
          )}

          {isEditable ? (
            <AddPlanItemForm
              planId={plan.id}
              planType={plan.type}
              selectableParents={selectableParents}
            />
          ) : null}
        </CardContent>
      </Card>

      <PlanActions
        planId={plan.id}
        status={plan.status}
        itemCount={plan.items.length}
        router={router}
      />
    </div>
  );
}

function PlanItemRow({
  planId,
  item,
  readOnly,
}: {
  planId: string;
  item: SerializedPlanItem;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePlanItemAction(planId, item.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <li className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.title}</span>
          {item.taskType ? (
            <span className="text-xs text-muted-foreground capitalize">
              {item.taskType.toLowerCase()}
            </span>
          ) : null}
          <VisibilityBadge visibility={item.visibility} />
          {item.completedAt ? (
            <span className="text-xs text-muted-foreground">Completed</span>
          ) : null}
        </div>
        {item.parentTitle ? (
          <p className="text-xs text-muted-foreground">
            From {item.taskType === PeriodType.DAILY ? "weekly" : "monthly"} task:{" "}
            {item.parentTitle}
          </p>
        ) : null}
        {item.description ? (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      {!readOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 />
        </Button>
      ) : null}
    </li>
  );
}

const NEW_TASK = "__new__";

function AddPlanItemForm({
  planId,
  planType,
  selectableParents,
}: {
  planId: string;
  planType: PeriodType;
  selectableParents: SelectableParentTask[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState(NEW_TASK);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMonthly = planType === PeriodType.MONTHLY;
  const isNewTask = isMonthly || mode === NEW_TASK;
  const selectedParent = selectableParents.find((t) => t.id === selectedParentId);

  const handleModeChange = (value: string) => {
    setMode(value);
    setSelectedParentId("");
    setTitle("");
    setDescription("");
  };

  const handleParentChange = (value: string) => {
    setSelectedParentId(value);
    const parent = selectableParents.find((t) => t.id === value);
    if (parent) {
      setTitle(parent.title);
      setDescription(parent.description ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (isNewTask) {
      formData.set("title", title);
      formData.set("description", description);
    } else {
      formData.set("parentTaskId", selectedParentId);
    }
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await addPlanItemAction(planId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode(NEW_TASK);
      setSelectedParentId("");
      setTitle("");
      setDescription("");
      setVisibility("PUBLIC");
      router.refresh();
    });
  };

  const canSubmit = isNewTask
    ? title.trim().length > 0
    : selectedParentId.length > 0 && !selectedParent?.disabled;

  const periodLabel =
    planType === PeriodType.WEEKLY
      ? "weekly"
      : planType === PeriodType.DAILY
        ? "daily"
        : "monthly";

  return (
    <>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm font-medium">Add {periodLabel} task</p>

        {!isMonthly ? (
          <div className="space-y-1.5">
            <Label htmlFor="task-mode">Source</Label>
            <select
              id="task-mode"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="flex h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value={NEW_TASK}>New independent task</option>
              <option value="parent">
                {planType === PeriodType.WEEKLY
                  ? "Sub-task from monthly task"
                  : "Sub-task from weekly task"}
              </option>
            </select>
          </div>
        ) : null}

        {isNewTask ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="item-title">Task title</Label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`What do you plan to work on?`}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Additional context…"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="parent-select">
                {planType === PeriodType.WEEKLY
                  ? "Monthly task"
                  : "Weekly task"}
              </Label>
              <select
                id="parent-select"
                value={selectedParentId}
                onChange={(e) => handleParentChange(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                required
              >
                <option value="">— Select —</option>
                {selectableParents.map((task) => (
                  <option key={task.id} value={task.id} disabled={task.disabled}>
                    {task.title}
                    {task.disabled && task.disabledReason
                      ? ` (${task.disabledReason})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedParent ? (
              <>
                <div className="space-y-1.5">
                  <Label>Task title</Label>
                  <p className="text-sm font-medium">{selectedParent.title}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Description (from parent)</Label>
                  <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {selectedParent.description?.trim()
                      ? selectedParent.description
                      : "No description"}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}

        <div className="space-y-1.5 sm:max-w-xs">
          <Label htmlFor="item-visibility">Visibility</Label>
          <select
            id="item-visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="PUBLIC">Public — visible to teammates</option>
            <option value="PRIVATE">Private — managers only</option>
          </select>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isPending || !canSubmit}>
          {isPending ? "Adding…" : "Add task"}
        </Button>
      </form>
    </>
  );
}

function PlanActions({
  planId,
  status,
  itemCount,
  router,
}: {
  planId: string;
  status: SubmissionStatus;
  itemCount: number;
  router: ReturnType<typeof useRouter>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canSubmit = itemCount > 0;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitPlanAction(planId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleReopen = () => {
    setError(null);
    startTransition(async () => {
      const result = await reopenPlanAction(planId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  if (status === SubmissionStatus.SUBMITTED) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            This plan has been submitted and is visible to your team.
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleReopen}
            disabled={isPending}
          >
            {isPending ? "Reopening…" : "Reopen as draft"}
          </Button>
          {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t-0 bg-transparent">
        <p className="text-sm text-muted-foreground">
          {canSubmit
            ? "Submit when ready — teammates will see public items after submission."
            : "Add at least one planned task before you can submit."}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
        >
          {isPending ? "Submitting…" : "Submit plan"}
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
