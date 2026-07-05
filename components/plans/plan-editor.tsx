"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash2 } from "lucide-react";

import { SubmissionStatus } from "@/app/generated/prisma/enums";
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

export type SerializedPlanItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  completedAt: string | null;
};

export type SerializedPlan = {
  id: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  periodStart: string;
  periodEnd: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  items: SerializedPlanItem[];
};

export type SelectableTask = {
  id: string;
  title: string;
  description: string | null;
};

type PlanEditorProps = {
  plan: SerializedPlan;
  selectableTasks?: SelectableTask[];
};

export function PlanEditor({ plan, selectableTasks = [] }: PlanEditorProps) {
  const router = useRouter();
  const isEditable = plan.status === SubmissionStatus.DRAFT;
  const periodLabel = formatPeriodLabel(
    plan.type,
    new Date(plan.periodStart),
    new Date(plan.periodEnd),
  );

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

      <Card>
        <CardHeader>
          <CardTitle>Planned tasks</CardTitle>
          <CardDescription>
            Discrete tasks you intend to work on during this period.
          </CardDescription>
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
            <AddPlanItemForm planId={plan.id} selectableTasks={selectableTasks} />
          ) : null}
        </CardContent>
      </Card>

      <PlanActions planId={plan.id} status={plan.status} router={router} />
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
          <VisibilityBadge visibility={item.visibility} />
          {item.completedAt ? (
            <span className="text-xs text-muted-foreground">Completed</span>
          ) : null}
        </div>
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
  selectableTasks = [],
}: {
  planId: string;
  selectableTasks?: SelectableTask[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(NEW_TASK);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isNewTask = selectedId === NEW_TASK;

  const handleSelectChange = (value: string) => {
    setSelectedId(value);
    if (value === NEW_TASK) {
      setTitle("");
      setDescription("");
      return;
    }
    const task = selectableTasks.find((t) => t.id === value);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (isNewTask) {
      formData.set("title", title);
    } else {
      formData.set("taskTitleId", selectedId);
    }
    formData.set("description", description);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await addPlanItemAction(planId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelectedId(NEW_TASK);
      setTitle("");
      setDescription("");
      setVisibility("PUBLIC");
      router.refresh();
    });
  };

  const canSubmit = isNewTask ? title.trim().length > 0 : selectedId !== NEW_TASK;

  return (
    <>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm font-medium">Add planned task</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="item-select">Select task</Label>
            <select
              id="item-select"
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value={NEW_TASK}>— New task —</option>
              {selectableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {selectableTasks.length === 0 && isNewTask ? (
              <p className="text-xs text-muted-foreground">
                No saved tasks yet. Create one below — it will appear in this list next time.
              </p>
            ) : null}
          </div>

          {isNewTask ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="item-title">Task title</Label>
              <Input
                id="item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you plan to work on?"
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Task title</Label>
              <p className="text-sm font-medium">{title}</p>
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Additional context for this task…"
            />
          </div>

          <div className="space-y-1.5">
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
  router,
}: {
  planId: string;
  status: SubmissionStatus;
  router: ReturnType<typeof useRouter>;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
          Submit when ready — teammates will see public items after submission.
        </p>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Submitting…" : "Submit plan"}
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
