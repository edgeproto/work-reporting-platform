"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Trash2 } from "lucide-react";

import { PeriodType, SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  addUnplannedEntryAction,
  checkOffPlanItemAction,
  deleteReportEntryAction,
  submitReportAction,
  uncheckPlanItemAction,
  updateReportEntryAction,
} from "@/app/(dashboard)/my-reports/actions";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import {
  ReportStatusBadge,
  VisibilityBadge,
} from "@/components/reports/report-badges";
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
import {
  TaskPicker,
  type SerializedSelectableTask,
} from "@/components/tasks/task-browser";

export type SerializedPlanItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  completedAt: string | null;
  completedInReportId: string | null;
  taskType: PeriodType | null;
  parentTitle: string | null;
};

export type SerializedReportEntry = {
  id: string;
  planItemId: string | null;
  title: string;
  description: string | null;
  hours: string;
  visibility: "PUBLIC" | "PRIVATE";
  attachmentCount: number;
};

export type SerializedMatchingPlan = {
  id: string;
  continuousNotes: string;
  items: SerializedPlanItem[];
};

export type SerializedReport = {
  id: string;
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  entries: SerializedReportEntry[];
  matchingPlan: SerializedMatchingPlan | null;
};

type ReportEditorProps = {
  report: SerializedReport;
  selectableTasks?: SerializedSelectableTask[];
};

export function ReportEditor({
  report,
  selectableTasks = [],
}: ReportEditorProps) {
  const isEditable = report.status === SubmissionStatus.DRAFT;
  const periodLabel = formatPeriodLabel(
    report.type,
    new Date(report.periodStart),
    new Date(report.periodEnd),
  );

  const entriesByPlanItemId = new Map(
    report.entries
      .filter((entry) => entry.planItemId)
      .map((entry) => [entry.planItemId!, entry]),
  );

  const unplannedEntries = report.entries.filter((entry) => !entry.planItemId);

  const totalHours = report.entries.reduce(
    (sum, entry) => sum + (Number(entry.hours) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {periodTypeLabel(report.type)} Report
          </h1>
          <p className="text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          {totalHours > 0 ? (
            <span className="text-sm text-muted-foreground">
              {totalHours.toFixed(1)} h total
            </span>
          ) : null}
          <DeleteReportButton reportId={report.id} variant="destructive" />
        </div>
      </div>

      {report.matchingPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>From your plan</CardTitle>
            <CardDescription>
              Check off completed tasks from your submitted plan. Each checked
              item becomes a report entry — add hours and adjust the description
              as needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.matchingPlan.continuousNotes.trim() ? (
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ongoing work (from plan)
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {report.matchingPlan.continuousNotes}
                </p>
              </div>
            ) : null}

            {report.matchingPlan.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your submitted plan has no discrete tasks.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {report.matchingPlan.items.map((item) => (
                  <PlanChecklistRow
                    key={item.id}
                    reportId={report.id}
                    item={item}
                    entry={entriesByPlanItemId.get(item.id) ?? null}
                    readOnly={!isEditable}
                    currentReportId={report.id}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No submitted plan for this period. Add unplanned work below, or file a
          plan first and submit it to enable check-off here.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Unplanned work</CardTitle>
          <CardDescription>
            Work that was not on your plan, or entries you add directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unplannedEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unplanned entries yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {unplannedEntries.map((entry) => (
                <ReportEntryCard
                  key={entry.id}
                  reportId={report.id}
                  entry={entry}
                  readOnly={!isEditable}
                  allowDelete
                />
              ))}
            </ul>
          )}

          {isEditable ? (
            <>
              <Separator />
              <AddUnplannedEntryForm
                reportId={report.id}
                selectableTasks={selectableTasks}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <ReportActions reportId={report.id} status={report.status} />
    </div>
  );
}

function PlanChecklistRow({
  reportId,
  item,
  entry,
  readOnly,
  currentReportId,
}: {
  reportId: string;
  item: SerializedPlanItem;
  entry: SerializedReportEntry | null;
  readOnly: boolean;
  currentReportId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const completedElsewhere =
    item.completedAt !== null && item.completedInReportId !== currentReportId;
  const checked = completedElsewhere || entry !== null;
  const disabled = readOnly || completedElsewhere || isPending;

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = entry
        ? await uncheckPlanItemAction(reportId, item.id)
        : await checkOffPlanItemAction(reportId, item.id);

      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-pressed={checked}
          aria-label={`${checked ? "Uncheck" : "Check off"} ${item.title}`}
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-input bg-background transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 data-[checked=true]:border-primary data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground"
          data-checked={checked}
        >
          {checked ? <Check className="size-3.5" /> : null}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              {item.taskType ? (
                <span className="text-xs text-muted-foreground capitalize">
                  {item.taskType.toLowerCase()}
                </span>
              ) : null}
              <VisibilityBadge visibility={item.visibility} />
              {completedElsewhere ? (
                <span className="text-xs text-muted-foreground">
                  Completed in another report
                </span>
              ) : null}
            </div>
            {item.parentTitle ? (
              <p className="text-xs text-muted-foreground">
                From {item.taskType === PeriodType.DAILY ? "weekly" : "monthly"}{" "}
                task: {item.parentTitle}
              </p>
            ) : null}
            {!entry && item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>

          {entry ? (
            <ReportEntryFields
              reportId={reportId}
              entry={entry}
              readOnly={readOnly}
            />
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </li>
  );
}

function ReportEntryCard({
  reportId,
  entry,
  readOnly,
  allowDelete,
}: {
  reportId: string;
  entry: SerializedReportEntry;
  readOnly: boolean;
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteReportEntryAction(reportId, entry.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <li className="rounded-lg border px-4 py-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{entry.title}</span>
            <VisibilityBadge visibility={entry.visibility} />
          </div>
          {entry.attachmentCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {entry.attachmentCount} attachment
              {entry.attachmentCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        {!readOnly && allowDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete ${entry.title}`}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <ReportEntryFields reportId={reportId} entry={entry} readOnly={readOnly} />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </li>
  );
}

function ReportEntryFields({
  reportId,
  entry,
  readOnly,
}: {
  reportId: string;
  entry: SerializedReportEntry;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(entry.description ?? "");
  const [hours, setHours] = useState(entry.hours);
  const [visibility, setVisibility] = useState(entry.visibility);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (readOnly) {
      return;
    }

    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("description", description);
    formData.set("hours", hours);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await updateReportEntryAction(reportId, entry.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  if (readOnly) {
    return (
      <div className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
        <span className="text-muted-foreground">Hours</span>
        <span>{Number(entry.hours).toFixed(1)}</span>
        {entry.description ? (
          <>
            <span className="text-muted-foreground">Description</span>
            <span className="whitespace-pre-wrap">{entry.description}</span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`hours-${entry.id}`}>Hours</Label>
        <Input
          id={`hours-${entry.id}`}
          type="number"
          min={0}
          max={24}
          step={0.25}
          value={hours}
          onChange={(e) => {
            setHours(e.target.value);
            setSaved(false);
          }}
          onBlur={save}
          disabled={isPending}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`visibility-${entry.id}`}>Visibility</Label>
        <select
          id={`visibility-${entry.id}`}
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value as "PUBLIC" | "PRIVATE");
            setSaved(false);
          }}
          onBlur={save}
          disabled={isPending}
          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`desc-${entry.id}`}>Description</Label>
        <Textarea
          id={`desc-${entry.id}`}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSaved(false);
          }}
          onBlur={save}
          rows={2}
          disabled={isPending}
          placeholder="What did you accomplish?"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive sm:col-span-2">{error}</p>
      ) : saved ? (
        <p className="text-xs text-muted-foreground sm:col-span-2">Saved</p>
      ) : null}
    </div>
  );
}

const EXISTING_TASK = "existing";
const NEW_TASK = "new";

function AddUnplannedEntryForm({
  reportId,
  selectableTasks,
}: {
  reportId: string;
  selectableTasks: SerializedSelectableTask[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState(
    selectableTasks.length > 0 ? EXISTING_TASK : NEW_TASK,
  );
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTask = selectableTasks.find((t) => t.id === selectedTaskId);
  const isExistingTask = mode === EXISTING_TASK;

  const handleModeChange = (value: string) => {
    setMode(value);
    setSelectedTaskId("");
    setTitle("");
    setDescription("");
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const task = selectableTasks.find((t) => t.id === taskId);
    if (task) {
      setDescription(task.description ?? "");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (isExistingTask) {
      formData.set("taskId", selectedTaskId);
      formData.set("description", description);
    } else {
      formData.set("title", title);
      formData.set("description", description);
    }
    formData.set("hours", hours);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await addUnplannedEntryAction(reportId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode(selectableTasks.length > 0 ? EXISTING_TASK : NEW_TASK);
      setSelectedTaskId("");
      setTitle("");
      setDescription("");
      setHours("");
      setVisibility("PUBLIC");
      router.refresh();
    });
  };

  const canSubmit = isExistingTask
    ? selectedTaskId.length > 0 && !selectedTask?.disabled && hours
    : title.trim().length > 0 && hours;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">Add unplanned entry</p>

      <div className="space-y-1.5">
        <Label htmlFor="unplanned-source">Source</Label>
        <select
          id="unplanned-source"
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
          className="flex h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value={EXISTING_TASK}>From My Tasks</option>
          <option value={NEW_TASK}>New task</option>
        </select>
      </div>

      {isExistingTask ? (
        <TaskPicker
          tasks={selectableTasks}
          selectedTaskId={selectedTaskId}
          onSelect={handleSelectTask}
          idPrefix="unplanned"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="unplanned-title">Task title</Label>
            <Input
              id="unplanned-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you work on?"
              required
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="unplanned-hours">Hours</Label>
          <Input
            id="unplanned-hours"
            type="number"
            min={0.25}
            max={24}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unplanned-visibility">Visibility</Label>
          <select
            id="unplanned-visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="unplanned-description">Description</Label>
          <Textarea
            id="unplanned-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What did you accomplish?"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "Adding…" : "Add entry"}
      </Button>
    </form>
  );
}

function ReportActions({
  reportId,
  status,
}: {
  reportId: string;
  status: SubmissionStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitReportAction(reportId);
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
        <CardContent className="flex flex-wrap items-center gap-2 pt-6 text-sm text-muted-foreground">
          <Lock className="size-4" />
          This report has been submitted and is read-only.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t-0 bg-transparent">
        <p className="text-sm text-muted-foreground">
          Submit when ready — checked plan items will be marked complete and
          public entries will be visible to your team.
        </p>
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Submitting…" : "Submit report"}
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
