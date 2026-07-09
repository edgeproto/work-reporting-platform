"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Paperclip, Trash2, Upload, X } from "lucide-react";

import { PeriodType, PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import {
  addUnplannedEntryAction,
  deleteAttachmentAction,
  deleteReportEntryAction,
  openTomorrowPlanAction,
  setPlanItemOutcomeAction,
  submitReportAction,
  updateReportEntryAction,
  uploadAttachmentAction,
} from "@/app/(dashboard)/my-reports/actions";
import { DeleteReportButton } from "@/components/reports/delete-report-button";
import { PlanItemOutcomeBadge } from "@/components/plans/plan-badges";
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
import { useDictionary, useI18n } from "@/components/i18n-provider";
import { formatMessage } from "@/lib/i18n/format";
import { formatFileSize } from "@/lib/i18n/format-file-size";
import { periodTypeLabel } from "@/lib/i18n/period-labels";
import { formatPeriodLabel } from "@/lib/periods";

export type SerializedPlanItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  outcome: PlanItemOutcome;
  completedInReportId: string | null;
};

export type SerializedAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type SerializedReportEntry = {
  id: string;
  planItemId: string | null;
  planItemOutcome: PlanItemOutcome | null;
  title: string;
  description: string | null;
  hours: string;
  visibility: "PUBLIC" | "PRIVATE";
  attachments: SerializedAttachment[];
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
  periodEditable: boolean;
  canFileTomorrowPlan: boolean;
  periodDay: string;
  entries: SerializedReportEntry[];
  matchingPlan: SerializedMatchingPlan | null;
};

type ReportEditorProps = {
  report: SerializedReport;
};

export function ReportEditor({ report }: ReportEditorProps) {
  const { locale } = useI18n();
  const dict = useDictionary();
  const isEditable =
    report.status === SubmissionStatus.DRAFT && report.periodEditable;
  const periodLabel = formatPeriodLabel(
    report.type,
    new Date(report.periodStart),
    new Date(report.periodEnd),
    undefined,
    locale,
    dict.periods,
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

  const isWeeklyOrMonthly =
    report.type === PeriodType.WEEKLY || report.type === PeriodType.MONTHLY;
  const entriesSectionTitle = isWeeklyOrMonthly
    ? dict.reports.entriesTitle
    : dict.reports.unplannedTitle;
  const entriesSectionDescription = isWeeklyOrMonthly
    ? dict.reports.entriesDescription
    : dict.reports.unplannedDescription;
  const emptyEntriesMessage = isWeeklyOrMonthly
    ? dict.reports.entriesEmpty
    : dict.reports.unplannedEmpty;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatMessage(dict.reports.title, {
              type: periodTypeLabel(report.type, dict),
            })}
          </h1>
          <p className="text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportStatusBadge status={report.status} />
          {totalHours > 0 ? (
            <span className="text-sm text-muted-foreground">
              {formatMessage(dict.reports.totalHours, {
                hours: totalHours.toFixed(1),
              })}
            </span>
          ) : null}
          <DeleteReportButton reportId={report.id} variant="destructive" />
        </div>
      </div>

      {report.matchingPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>{dict.reports.fromPlanTitle}</CardTitle>
            <CardDescription>{dict.reports.fromPlanDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.matchingPlan.continuousNotes.trim() ? (
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dict.reports.ongoingWork}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {report.matchingPlan.continuousNotes}
                </p>
              </div>
            ) : null}

            {report.matchingPlan.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {dict.reports.fromPlanEmpty}
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
          {dict.reports.noPlanMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{entriesSectionTitle}</CardTitle>
          <CardDescription>{entriesSectionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unplannedEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyEntriesMessage}</p>
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
              <AddUnplannedEntryForm reportId={report.id} />
            </>
          ) : null}
        </CardContent>
      </Card>

      {!report.periodEditable && report.status === SubmissionStatus.DRAFT ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {dict.reports.outsideEditWindow}
        </p>
      ) : null}

      <ReportActions
        reportId={report.id}
        status={report.status}
        entries={report.entries}
        periodEditable={report.periodEditable}
        canFileTomorrowPlan={report.canFileTomorrowPlan}
        periodDay={report.periodDay}
        matchingPlan={report.matchingPlan}
      />
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
  const dict = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const resolvedElsewhere =
    item.outcome !== PlanItemOutcome.OPEN &&
    item.completedInReportId !== currentReportId;
  const currentOutcome =
    entry?.planItemOutcome ??
    (entry ? PlanItemOutcome.COMPLETED : PlanItemOutcome.OPEN);
  const disabled = readOnly || resolvedElsewhere || isPending;

  const handleOutcomeChange = (outcome: PlanItemOutcome) => {
    if (disabled) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await setPlanItemOutcomeAction(reportId, item.id, outcome);
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
        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              <VisibilityBadge visibility={item.visibility} />
              {resolvedElsewhere ? (
                <PlanItemOutcomeBadge outcome={item.outcome} />
              ) : null}
              {resolvedElsewhere ? (
                <span className="text-xs text-muted-foreground">
                  {dict.reports.resolvedElsewhere}
                </span>
              ) : null}
            </div>
            {!entry && item.description ? (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            ) : null}
          </div>

          {!resolvedElsewhere && !readOnly ? (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={formatMessage(dict.reports.checkOffItem, {
                title: item.title,
              })}
            >
              {(
                [
                  PlanItemOutcome.OPEN,
                  PlanItemOutcome.COMPLETED,
                  PlanItemOutcome.FAILED,
                  PlanItemOutcome.CANCELLED,
                ] as const
              ).map((outcome) => (
                <Button
                  key={outcome}
                  type="button"
                  size="sm"
                  variant={currentOutcome === outcome ? "default" : "outline"}
                  onClick={() => handleOutcomeChange(outcome)}
                  disabled={disabled}
                >
                  {outcome === PlanItemOutcome.OPEN
                    ? dict.badges.open
                    : outcome === PlanItemOutcome.COMPLETED
                      ? dict.badges.completed
                      : outcome === PlanItemOutcome.FAILED
                        ? dict.badges.failed
                        : dict.badges.cancelled}
                </Button>
              ))}
            </div>
          ) : resolvedElsewhere || readOnly ? (
            <PlanItemOutcomeBadge outcome={item.outcome} />
          ) : null}

          {entry && currentOutcome === PlanItemOutcome.COMPLETED ? (
            <ReportEntryFields
              reportId={reportId}
              entry={entry}
              readOnly={readOnly}
            />
          ) : entry &&
            (currentOutcome === PlanItemOutcome.FAILED ||
              currentOutcome === PlanItemOutcome.CANCELLED) ? (
            <p className="text-sm text-muted-foreground">
              {currentOutcome === PlanItemOutcome.FAILED
                ? dict.reports.failedNote
                : dict.reports.cancelledNote}
            </p>
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
  const dict = useDictionary();
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
        </div>
        {!readOnly && allowDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={formatMessage(dict.common.deleteItem, {
              title: entry.title,
            })}
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
  const dict = useDictionary();
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
      <div className="space-y-3">
        <div className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
          <span className="text-muted-foreground">{dict.common.hours}</span>
          <span>{Number(entry.hours).toFixed(1)}</span>
          {entry.description ? (
            <>
              <span className="text-muted-foreground">
                {dict.common.description}
              </span>
              <span className="whitespace-pre-wrap">{entry.description}</span>
            </>
          ) : null}
        </div>
        <EntryAttachments
          reportId={reportId}
          entryId={entry.id}
          attachments={entry.attachments}
          readOnly
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`hours-${entry.id}`}>{dict.common.hours}</Label>
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
        <Label htmlFor={`visibility-${entry.id}`}>
          {dict.common.visibility}
        </Label>
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
          <option value="PUBLIC">{dict.badges.public}</option>
          <option value="PRIVATE">{dict.badges.private}</option>
        </select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`desc-${entry.id}`}>{dict.common.description}</Label>
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
          placeholder={dict.reports.descriptionPlaceholder}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive sm:col-span-2">{error}</p>
      ) : saved ? (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {dict.reports.saved}
        </p>
      ) : null}
      </div>
      <EntryAttachments
        reportId={reportId}
        entryId={entry.id}
        attachments={entry.attachments}
        readOnly={false}
      />
    </div>
  );
}

function EntryAttachments({
  reportId,
  entryId,
  attachments,
  readOnly,
}: {
  reportId: string;
  entryId: string;
  attachments: SerializedAttachment[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const dict = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAttachmentAction(reportId, entryId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleDelete = (attachmentId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAttachmentAction(reportId, attachmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-3.5" />
        {dict.plans.attachments}
      </div>

      {attachments.length > 0 ? (
        <ul className="space-y-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5 text-sm"
            >
              <a
                href={`/api/attachments/${attachment.id}`}
                className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
                download={attachment.fileName}
              >
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{attachment.fileName}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(attachment.sizeBytes, dict)}
                </span>
              </a>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={isPending}
                  aria-label={formatMessage(dict.common.removeFile, {
                    fileName: attachment.fileName,
                  })}
                >
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{dict.plans.noAttachments}</p>
      )}

      {!readOnly ? (
        <div>
          <Label
            htmlFor={`upload-${entryId}`}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-normal text-primary hover:underline"
          >
            <Upload className="size-3.5" />
            {isPending ? dict.plans.uploading : dict.plans.uploadFile}
          </Label>
          <input
            id={`upload-${entryId}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleUpload}
            disabled={isPending}
            className="sr-only"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {dict.reports.attachmentsHint}
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function AddUnplannedEntryForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const dict = useDictionary();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("hours", hours);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await addUnplannedEntryAction(reportId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      setDescription("");
      setHours("");
      setVisibility("PUBLIC");
      router.refresh();
    });
  };

  const canSubmit = title.trim().length > 0 && hours;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium">{dict.reports.addEntryTitle}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="unplanned-title">{dict.common.title}</Label>
          <Input
            id="unplanned-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={dict.reports.addEntryPlaceholder}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unplanned-hours">{dict.common.hours}</Label>
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
          <Label htmlFor="unplanned-visibility">{dict.common.visibility}</Label>
          <select
            id="unplanned-visibility"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="PUBLIC">{dict.badges.public}</option>
            <option value="PRIVATE">{dict.badges.private}</option>
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="unplanned-description">{dict.common.description}</Label>
          <Textarea
            id="unplanned-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder={dict.reports.descriptionPlaceholder}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? dict.reports.adding : dict.reports.addEntry}
      </Button>
    </form>
  );
}

function ReportActions({
  reportId,
  status,
  entries,
  periodEditable,
  canFileTomorrowPlan,
  periodDay,
  matchingPlan,
}: {
  reportId: string;
  status: SubmissionStatus;
  entries: SerializedReportEntry[];
  periodEditable: boolean;
  canFileTomorrowPlan: boolean;
  periodDay: string;
  matchingPlan: SerializedMatchingPlan | null;
}) {
  const router = useRouter();
  const dict = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasEntries = entries.length > 0;
  const allEntriesValid = entries.every((entry) => {
    const hours = Number(entry.hours);
    const outcome = entry.planItemOutcome ?? PlanItemOutcome.COMPLETED;
    const requiresHours =
      !entry.planItemId || outcome === PlanItemOutcome.COMPLETED;
    return !requiresHours || (Number.isFinite(hours) && hours > 0);
  });
  const canSubmit = hasEntries && allEntriesValid && periodEditable;

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

  const handleTomorrowPlan = () => {
    setError(null);
    startTransition(async () => {
      const result = await openTomorrowPlanAction(periodDay);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (status === SubmissionStatus.SUBMITTED) {
    const resolvedCount = matchingPlan
      ? matchingPlan.items.filter(
          (item) =>
            item.completedInReportId === reportId ||
            entries.some((entry) => entry.planItemId === item.id),
        ).length
      : 0;
    const planItemCount = matchingPlan?.items.length ?? 0;

    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            {dict.reports.submittedMessage}
          </div>
          {matchingPlan && planItemCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {formatMessage(dict.reports.checklist, {
                resolved: resolvedCount,
                total: planItemCount,
              })}
            </p>
          ) : null}
          {canFileTomorrowPlan ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <p className="text-sm">{dict.reports.tomorrowPrompt}</p>
              <Button
                type="button"
                onClick={handleTomorrowPlan}
                disabled={isPending}
              >
                {isPending ? dict.reports.tomorrowOpening : dict.reports.tomorrowFile}
              </Button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  if (!periodEditable) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {dict.reports.draftOutsideWindow}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t-0 bg-transparent">
        <p className="text-sm text-muted-foreground">
          {!hasEntries
            ? dict.reports.submitNeedEntries
            : !allEntriesValid
              ? dict.reports.submitNeedHours
              : dict.reports.submitReady}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
        >
          {isPending ? dict.reports.submitting : dict.reports.submit}
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
