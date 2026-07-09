"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PeriodType, PlanItemOutcome } from "@/app/generated/prisma/enums";
import { requireSession } from "@/lib/auth";
import {
  actionError,
  firstValidationError,
  getActionDictionary,
} from "@/lib/i18n/action-dictionary";
import { createPlanForPeriod } from "@/lib/plans/mutations";
import { addDays, canEditPeriod, getPeriodBounds } from "@/lib/periods";
import {
  addUnplannedEntry,
  checkOffPlanItem,
  createReportForPeriod,
  deleteReport,
  deleteReportEntry,
  setPlanItemOutcomeInReport,
  submitReport,
  uncheckPlanItem,
  updateReportEntry,
} from "@/lib/reports/mutations";
import {
  addAttachment,
  deleteAttachment,
} from "@/lib/reports/attachments";
import {
  dateStringSchema,
  periodTypeSchema,
  reportEntryUpdateSchema,
  unplannedEntrySchema,
} from "@/lib/validation";

export type ActionResult = {
  error?: string;
  success?: boolean;
  entryId?: string;
};

const createReportSchema = z.object({
  type: periodTypeSchema,
  date: dateStringSchema,
});

export async function createReportAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = createReportSchema.safeParse({
    type: formData.get("type"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    const dict = await getActionDictionary();
    return { error: dict.errors.invalidReportParameters };
  }

  const report = await createReportForPeriod(
    session.user.id,
    session.user.organizationId,
    parsed.data.type as PeriodType,
    parsed.data.date,
  );

  revalidatePath("/my-reports");
  redirect(`/my-reports/${report.id}`);
}

export async function checkOffPlanItemAction(
  reportId: string,
  planItemId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    const entry = await checkOffPlanItem(
      reportId,
      planItemId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    return { error: await actionError("unableToCheckOffItem", error) };
  }
}

export async function uncheckPlanItemAction(
  reportId: string,
  planItemId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await uncheckPlanItem(
      reportId,
      planItemId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUncheckItem", error) };
  }
}

export async function setPlanItemOutcomeAction(
  reportId: string,
  planItemId: string,
  outcome: PlanItemOutcome,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await setPlanItemOutcomeInReport(
      reportId,
      planItemId,
      outcome,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdatePlanItem", error) };
  }
}

export async function addUnplannedEntryAction(
  reportId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = unplannedEntrySchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    hours: formData.get("hours"),
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    const entry = await addUnplannedEntry(
      reportId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true, entryId: entry.id };
  } catch (error) {
    return { error: await actionError("unableToAddEntry", error) };
  }
}

export async function updateReportEntryAction(
  reportId: string,
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = reportEntryUpdateSchema.safeParse({
    description: formData.get("description") || undefined,
    hours: formData.get("hours"),
    visibility: formData.get("visibility") ?? "PUBLIC",
  });

  if (!parsed.success) {
    return { error: await firstValidationError(parsed.error) };
  }

  try {
    await updateReportEntry(
      entryId,
      reportId,
      session.user.id,
      session.user.organizationId,
      parsed.data,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUpdateEntry", error) };
  }
}

export async function deleteReportEntryAction(
  reportId: string,
  entryId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deleteReportEntry(
      entryId,
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToDeleteEntry", error) };
  }
}

export async function submitReportAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await submitReport(
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/");
    revalidatePath("/my-reports");
    revalidatePath(`/my-reports/${reportId}`);
    revalidatePath("/my-plans");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToSubmitReport", error) };
  }
}

export async function openTomorrowPlanAction(
  reportDay: string,
): Promise<ActionResult> {
  const session = await requireSession();
  const dict = await getActionDictionary();
  const parsed = dateStringSchema.safeParse(reportDay);
  if (!parsed.success) {
    return { error: dict.errors.invalidDate };
  }

  const tomorrow = addDays(parsed.data, 1);

  try {
    const bounds = getPeriodBounds(PeriodType.DAILY, tomorrow);
    if (!canEditPeriod(PeriodType.DAILY, bounds.periodStart, bounds.periodEnd)) {
      return { error: dict.errors.tomorrowPlanOutsideWindow };
    }

    const plan = await createPlanForPeriod(
      session.user.id,
      session.user.organizationId,
      PeriodType.DAILY,
      tomorrow,
    );
    revalidatePath("/");
    redirect(`/my-plans/${plan.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: await actionError("unableToOpenTomorrowsPlan", error) };
  }
}

export async function deleteReportAction(reportId: string): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deleteReport(
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath("/my-reports");
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToDeleteReport", error) };
  }
}

export async function uploadAttachmentAction(
  reportId: string,
  entryId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    const dict = await getActionDictionary();
    return { error: dict.errors.noFileSelected };
  }

  try {
    await addAttachment(
      reportId,
      entryId,
      session.user.id,
      session.user.organizationId,
      file,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToUploadFile", error) };
  }
}

export async function deleteAttachmentAction(
  reportId: string,
  attachmentId: string,
): Promise<ActionResult> {
  const session = await requireSession();

  try {
    await deleteAttachment(
      attachmentId,
      reportId,
      session.user.id,
      session.user.organizationId,
    );
    revalidatePath(`/my-reports/${reportId}`);
    return { success: true };
  } catch (error) {
    return { error: await actionError("unableToDeleteAttachment", error) };
  }
}
