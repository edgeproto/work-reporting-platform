"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Paperclip, Pencil, Trash2, Upload, X } from "lucide-react";

import { PeriodType, PlanItemOutcome, SubmissionStatus } from "@/app/generated/prisma/enums";
import { PlanItemOutcomeBadge } from "@/components/plans/plan-badges";
import {
  addPlanItemAction,
  deletePlanItemAction,
  deletePlanItemAttachmentAction,
  reopenPlanAction,
  submitPlanAction,
  updatePlanItemAction,
  uploadPlanItemAttachmentAction,
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
import { useDictionary, useI18n } from "@/components/i18n-provider";
import { formatMessage } from "@/lib/i18n/format";
import { formatFileSize } from "@/lib/i18n/format-file-size";
import { periodTypeLabel } from "@/lib/i18n/period-labels";
import { formatPeriodLabel } from "@/lib/periods";

export type SerializedPlanAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type SerializedPlanItem = {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  outcome: PlanItemOutcome;
  attachments: SerializedPlanAttachment[];
};

export type SerializedPlan = {
  id: string;
  type: PeriodType;
  periodStart: string;
  periodEnd: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  periodEditable: boolean;
  items: SerializedPlanItem[];
};

type PlanEditorProps = {
  plan: SerializedPlan;
};

export function PlanEditor({ plan }: PlanEditorProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const dict = useDictionary();
  const isDraft = plan.status === SubmissionStatus.DRAFT;
  const isSubmitted = plan.status === SubmissionStatus.SUBMITTED;
  const canAddItems = isDraft && plan.periodEditable;
  const canEditItems =
    plan.periodEditable && (isDraft || isSubmitted);
  const periodLabel = formatPeriodLabel(
    plan.type,
    new Date(plan.periodStart),
    new Date(plan.periodEnd),
    undefined,
    locale,
    dict.periods,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatMessage(dict.plans.title, {
              type: periodTypeLabel(plan.type, dict),
            })}
          </h1>
          <p className="text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanStatusBadge status={plan.status} />
          <DeletePlanButton planId={plan.id} variant="destructive" />
        </div>
      </div>

      {!plan.periodEditable ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {dict.plans.outsideEditWindow}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{dict.plans.itemsTitle}</CardTitle>
          <CardDescription>{dict.plans.itemsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dict.plans.itemsEmpty}
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {plan.items.map((item) => (
                <PlanItemRow
                  key={item.id}
                  planId={plan.id}
                  item={item}
                  canEdit={canEditItems && item.outcome === PlanItemOutcome.OPEN}
                  canDelete={canAddItems}
                />
              ))}
            </ul>
          )}

          {canAddItems ? <AddPlanItemForm planId={plan.id} /> : null}
        </CardContent>
      </Card>

      <PlanActions
        planId={plan.id}
        status={plan.status}
        itemCount={plan.items.length}
        periodEditable={plan.periodEditable}
        router={router}
      />
    </div>
  );
}

function PlanItemAttachments({
  planId,
  itemId,
  attachments,
  readOnly,
  compact = false,
}: {
  planId: string;
  itemId: string;
  attachments: SerializedPlanAttachment[];
  readOnly: boolean;
  compact?: boolean;
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
      const result = await uploadPlanItemAttachmentAction(
        planId,
        itemId,
        formData,
      );
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
      const result = await deletePlanItemAttachmentAction(planId, attachmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  if (compact) {
    if (attachments.length === 0) {
      return null;
    }

    return (
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Paperclip className="size-3.5 shrink-0" aria-hidden />
        {attachments.map((attachment, index) => (
          <span key={attachment.id} className="inline-flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden>,</span> : null}
            <a
              href={`/api/attachments/${attachment.id}`}
              className="hover:underline"
              download={attachment.fileName}
            >
              {attachment.fileName}
            </a>
          </span>
        ))}
      </p>
    );
  }

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
            htmlFor={`plan-upload-${itemId}`}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-normal text-primary hover:underline"
          >
            <Upload className="size-3.5" />
            {isPending ? dict.plans.uploading : dict.plans.uploadFile}
          </Label>
          <input
            id={`plan-upload-${itemId}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleUpload}
            disabled={isPending}
            className="sr-only"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function PlanItemRow({
  planId,
  item,
  canEdit,
  canDelete,
}: {
  planId: string;
  item: SerializedPlanItem;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const dict = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [visibility, setVisibility] = useState(item.visibility);

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

  const handleSave = () => {
    setError(null);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await updatePlanItemAction(planId, item.id, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  if (editing) {
    return (
      <li className="space-y-3 px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`edit-title-${item.id}`}>{dict.common.title}</Label>
            <Input
              id={`edit-title-${item.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`edit-desc-${item.id}`}>
              {dict.common.description}
            </Label>
            <Textarea
              id={`edit-desc-${item.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`edit-vis-${item.id}`}>
              {dict.common.visibility}
            </Label>
            <select
              id={`edit-vis-${item.id}`}
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
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending || title.trim().length === 0}
          >
            {isPending ? dict.common.saving : dict.common.save}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(false);
              setTitle(item.title);
              setDescription(item.description ?? "");
              setVisibility(item.visibility);
              setError(null);
            }}
            disabled={isPending}
          >
            {dict.common.cancel}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <PlanItemAttachments
          planId={planId}
          itemId={item.id}
          attachments={item.attachments}
          readOnly={false}
        />
      </li>
    );
  }

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{item.title}</span>
            <VisibilityBadge visibility={item.visibility} />
            {item.outcome !== PlanItemOutcome.OPEN ? (
              <PlanItemOutcomeBadge outcome={item.outcome} />
            ) : null}
          </div>
          {item.description ? (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
              disabled={isPending}
              aria-label={formatMessage(dict.common.editItem, {
                title: item.title,
              })}
            >
              <Pencil />
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={isPending}
              aria-label={formatMessage(dict.common.deleteItem, {
                title: item.title,
              })}
            >
              <Trash2 />
            </Button>
          ) : null}
        </div>
      </div>
      <PlanItemAttachments
        planId={planId}
        itemId={item.id}
        attachments={item.attachments}
        readOnly
        compact
      />
    </li>
  );
}

function AddPlanItemForm({ planId }: { planId: string }) {
  const router = useRouter();
  const dict = useDictionary();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("visibility", visibility);

    startTransition(async () => {
      const result = await addPlanItemAction(planId, {}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      // Attachment requires an item id; refresh then let user attach on the row.
      // If a file was selected on create, we re-fetch via refresh — attach after
      // add by uploading once the page reloads isn't available. Prefer uploading
      // on the new item after create when file is present via a follow-up path.
      if (file && result.itemId) {
        const uploadData = new FormData();
        uploadData.set("file", file);
        const uploadResult = await uploadPlanItemAttachmentAction(
          planId,
          result.itemId,
          uploadData,
        );
        if (uploadResult.error) {
          setError(uploadResult.error);
          router.refresh();
          return;
        }
      }

      setTitle("");
      setDescription("");
      setVisibility("PUBLIC");
      setFile(null);
      router.refresh();
    });
  };

  return (
    <>
      <Separator />
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm font-medium">{dict.plans.addItemTitle}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="item-title">{dict.common.title}</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.plans.titlePlaceholder}
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="item-description">{dict.common.description}</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={dict.plans.descriptionPlaceholder}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-visibility">{dict.common.visibility}</Label>
            <select
              id="item-visibility"
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
              }
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="PUBLIC">{dict.plans.visibilityPublicHint}</option>
              <option value="PRIVATE">{dict.plans.visibilityPrivateHint}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item-file">{dict.plans.fileOptional}</Label>
            <Input
              id="item-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isPending || title.trim().length === 0}>
          {isPending ? dict.plans.adding : dict.plans.addItem}
        </Button>
      </form>
    </>
  );
}

function PlanActions({
  planId,
  status,
  itemCount,
  periodEditable,
  router,
}: {
  planId: string;
  status: SubmissionStatus;
  itemCount: number;
  periodEditable: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  const dict = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canSubmit = itemCount > 0 && periodEditable;

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
            {dict.plans.submittedMessage}
          </div>
          {periodEditable ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleReopen}
              disabled={isPending}
            >
              {isPending ? dict.plans.reopening : dict.plans.reopenDraft}
            </Button>
          ) : null}
          {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    );
  }

  if (!periodEditable) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {dict.plans.draftOutsideWindow}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t-0 bg-transparent">
        <p className="text-sm text-muted-foreground">
          {canSubmit ? dict.plans.submitReady : dict.plans.submitNeedItems}
        </p>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
        >
          {isPending ? dict.plans.submitting : dict.plans.submit}
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}
